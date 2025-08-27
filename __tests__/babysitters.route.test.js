// TDD Caroline
// Test de la route GET /babysitters avec Jest + Supertest.
// On ne touche pas au code de la route : tout est testé en simulant (mock) la DB.

const express = require("express");
const request = require("supertest");

// Mock de la connexion pour empêcher un vrai connect
jest.mock("../connection/connection", () => ({}));

// Mock du modèle User (Mongoose) : on expose aggregate: jest.fn()
jest.mock("../models/users", () => ({
  aggregate: jest.fn(),
}));

// Import du routeur APRÈS les mocks -> Evite d'importer la vrai version de user et connection.
const usersRouter = require("../routes/users");

// Helper pour monter une mini appli Express avec uniquement notre route.
function createApp() {
  const app = express();
  app.use(express.json()); // pour parser JSON dans les requêtes.
  app.use("/", usersRouter); // on monte le routeur comme dans l'app réelle.
  return app;
}

// Avant chaque test, on reset l’état du mock User.aggregate
beforeEach(() => {
  const User = require("../models/users");
  User.aggregate.mockReset();
});

// Bloc de tests ciblés sur GET /babysitters
describe("GET /babysitters", () => {
  // ---------------------- TEST 1
  test('filtre par âge "18-25" et formate les champs', async () => {
    // On simule la réponse de l’agrégat Mongo
    // => seuls Alice et Claire devraient rester avec filtre 18-25
    const User = require("../models/users");
    User.aggregate.mockResolvedValue([
      {
        _id: "idA",
        firstName: "Alice",
        lastName: "A",
        avatar: "urlA",
        rating: 4.2345, // arrondi à 4.23
        babysits: 3,
        babysitterInfos: { age: "22", price: 10, availability: [] },
        location: { lat: 48.85, lon: 2.35 },
      },
      {
        _id: "idB",
        firstName: "Bob",
        lastName: "B",
        avatar: "urlB",
        rating: 3.9,
        babysits: 1,
        babysitterInfos: { age: "30", price: 12, availability: [] },
        location: { lat: 48.86, lon: 2.34 },
      },
      {
        _id: "idC",
        firstName: "Claire",
        lastName: "C",
        avatar: "urlC",
        rating: null, // -> 0
        babysits: 0,
        babysitterInfos: { age: "19", price: 9, availability: [] },
        location: { lat: 48.87, lon: 2.33 },
      },
    ]);

    // On monte l’app Express
    const app = createApp();
    // On appelle GET /babysitters?ageRange=18-25
    const res = await request(app)
      .get("/babysitters")
      .query({ ageRange: "18-25" });

    // ---------------------- Vérifications
    expect(res.status).toBe(200);
    expect(res.body.result).toBe(true);

    // On ne doit avoir que Alice et Claire
    const names = res.body.babysitters.map((b) => b.firstName);
    expect(names).toEqual(["Alice", "Claire"]); // Bob (30) exclu

    // Alice : rating arrondi à 2 décimales
    const alice = res.body.babysitters.find((b) => b.firstName === "Alice");
    expect(alice.rating).toBe(4.23);
    // Pas de calcul de distance => undefined
    expect(alice.distanceKm).toBeUndefined();

    // Claire : rating null -> transformé en 0
    const claire = res.body.babysitters.find((b) => b.firstName === "Claire");
    expect(claire.rating).toBe(0);

    // Nombre total = 2
    expect(res.body.total).toBe(2);
  });

  // ---------------------- TEST 2
  test("filtre distance + jour + heures, tri -age", async () => {
    const User = require("../models/users");

    // Cas de 3 babysitters :
    // - Dalia : proche
    // - Eloi  : trop loin => exclu
    // - Félix : chevauche 16h-20h
    User.aggregate.mockResolvedValue([
      {
        _id: "idD",
        firstName: "Dalia",
        lastName: "D",
        avatar: "urlD",
        rating: 4.8,
        babysits: 10,
        babysitterInfos: {
          age: "22",
          price: 15,
          availability: [
            { day: "Mardi", startHour: "16h00", endHour: "20h00" },
          ],
        },
        location: { lat: 0.01, lon: 0.01 }, // coordonnées proches
      },
      {
        _id: "idE",
        firstName: "Eloi",
        lastName: "E",
        avatar: "urlE",
        rating: 4.2,
        babysits: 5,
        babysitterInfos: {
          age: "25",
          price: 12,
          availability: [
            { day: "Mardi", startHour: "16h00", endHour: "20h00" },
          ],
        },
        location: { lat: 50, lon: 50 }, // loin => exclu
      },
      {
        _id: "idF",
        firstName: "Félix",
        lastName: "F",
        avatar: "urlF",
        rating: 4.1,
        babysits: 2,
        babysitterInfos: {
          age: "30",
          price: 20,
          availability: [
            { day: "Mardi", startHour: "15h00", endHour: "17h00" },
          ],
        },
        location: { lat: 0.01, lon: 0.01 }, // coordonnées proches
      },
    ]);

    const app = createApp();
    // Appel avec filtres
    const res = await request(app).get("/babysitters").query({
      parentLat: "0.01",
      parentLon: "0.01",
      maxDistanceKm: "5",
      day: "Mardi",
      hours: "16h00-20h00",
      sort: "-age",
    });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe(true);

    // Eloi exclu (trop loin). Reste Dalia (22) et Félix (30), tri -age => Félix, Dalia
    const names = res.body.babysitters.map((b) => b.firstName);
    expect(names).toEqual(["Félix", "Dalia"]);

    // Distances calculées ~0 km et arrondies à 0.1
    for (const b of res.body.babysitters) {
      expect(typeof b.distanceKm).toBe("number");
      expect(b.distanceKm).toBeCloseTo(0, 1);
    }
  });
});
