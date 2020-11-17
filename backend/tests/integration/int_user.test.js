const User = require("../../models/user");
const mockingoose = require('mockingoose').default;

const app = require('../../app') // Link to your server file
const supertest = require("supertest"); // supertest is a framework that allows to easily test web apis
const request = supertest(app)


describe("testing-user-routes", () => {

    // mongoose mocked ret values
    const guest1 = new User({
      userId: "1",
      username: "Arnold",
      deviceToken: "x"
    });
    const guest2 = new User({
      userId: "2",
      username: "Parsa",
      deviceToken: "y"
    });
    const user1 = new User({
        username: "Arnold Ying",
        date: "2020-11-03T02:33:32.515Z",
        _id: "5f9630e9a6f16e0a31a2a565",
        userId: "109786710572605387609",
        __v: 0,
        deviceToken: "exRsy5QSRlKCK9LMJQUI0t:APA91bHPfk9D8rK3OLsR2Xxp12PUDrLr9MyjSYFYt65PWDomNLHJlTeb4WnGucis63csf4RoK8-ClpPx1rWjXVfwxt-6a88xMk1UtamEj4uknu41eidqA3kRMFkKHG27Hfl2f0CW9wAt"
    });
    const deleteUser1 = {
        acknowledged: true,
        deletedCount: 1
    };

    beforeAll(() => {
        jest.useFakeTimers();
    });

    beforeEach(() => {
        mockingoose(User).toReturn(guest1, 'findOne');
        mockingoose(User).toReturn([guest1,guest2], 'find');
        mockingoose(User).toReturn(user1, 'updateOne');
        mockingoose(User).toReturn(deleteUser1, 'deleteOne');
    });
 
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("GET / - success", async done => {
        const res = await request.get("/"); //uses the request function that calls on express app instance

        expect(res.body).toBe("home");
        expect(res.status).toBe(200);
        done();
    });

    it("GET /user/getAll - success", async done => {
        const res = await request.get("/user/getAll"); //uses the request function that calls on express app instance
        // expect(res.body).toBe([
        //     guest1,
        //     guest2
        // ])
        expect(res.status).toBe(200);
        expect(res.body).toBeTruthy();
        done();
    });

    // it("GET /user/getAll - error 404", async () => {
    //     const res = await request.get("/user/getAll"); 
    //     expect(res.status).toBe(404);
    // });

    it("GET /user/ - success", async done => {
        const res = await request.get("/user").send({ userId: "1" }); //uses the request function that calls on express app instance
        
        expect(res.status).toBe(200);
        expect(res.body).toBeTruthy();
        // expect(res.body).toBe([
            // {
            //     userId: "1",
            //     username: "Arnold",
            //     deviceToken: "x"
            // },
        // ]);
        done();
    });

    it("GET /user/ - null userId", async () => {
        const res = await request.get("/user", { userId: null }); //uses the request function that calls on express app instance
        expect(res.status).toEqual(400);
    });

    it("POST /user/ - success - same as existing user", async () => { //using a new user would cause other tests to fail, but its the same test due to the upsert keyword
        const res = await request.post("/user").send(
            {
                username: "Arnold Ying",
                date: "2020-11-03T02:33:32.515Z",
                userId: "109786710572605387609",
                deviceToken: "exRsy5QSRlKCK9LMJQUI0t:APA91bHPfk9D8rK3OLsR2Xxp12PUDrLr9MyjSYFYt65PWDomNLHJlTeb4WnGucis63csf4RoK8-ClpPx1rWjXVfwxt-6a88xMk1UtamEj4uknu41eidqA3kRMFkKHG27Hfl2f0CW9wAt"
            }); //uses the request function that calls on express app instance
        
        expect(res.body).toBeTruthy();
        // expect(res.body).toBe([
        //     {
        //         username: "Arnold Ying",
        //         date: "2020-11-03T02:33:32.515Z",
        //         _id: "5f9630e9a6f16e0a31a2a565",
        //         userId: "109786710572605387609",
        //         __v: 0,
        //         deviceToken: "exRsy5QSRlKCK9LMJQUI0t:APA91bHPfk9D8rK3OLsR2Xxp12PUDrLr9MyjSYFYt65PWDomNLHJlTeb4WnGucis63csf4RoK8-ClpPx1rWjXVfwxt-6a88xMk1UtamEj4uknu41eidqA3kRMFkKHG27Hfl2f0CW9wAt"
        //     },
        // ]);
        expect(res.status).toBe(201);
    });

    it("POST /user/ - fail - bad input", async () => { //using a new user would cause other tests to fail, but its the same test due to the upsert keyword
        const res = await request.post("/user");
        expect(res.status).toEqual(400);
    });

    it("POST & DELETE /user/ - success - new user", async () => { // we can create a new user as long as we delete it after
        const res = await request.post("/user").send(
            {
                username: "I should be deleted soon",
                date: "2020-11-03T02:33:32.515Z",
                userId: "12345678",
                deviceToken: "111"
            }); //uses the request function that calls on express app instance
        expect(res.body).toBeTruthy();
        // expect(res.body).toBe([
        //     {
        //         username: "I should be deleted soon",
        //         date: "2020-11-03T02:33:32.515Z",
        //         userId: "12345678",
        //         deviceToken: "111"
        //     },
        // ]);
        expect(res.status).toBe(201);

        //DELETE ONCE
        const res2  = await request.delete("/user").send(
            {
                userId: "12345678",
            }); //uses the request function that calls on express app instance
        expect(res2.body).toEqual("delete successful");
        expect(res2.status).toEqual(200);

        //SHOULD BE DELETED, GET ERROR CASE OF DOUBLE DELETE
        const res3 = await request.delete("/user").send(
            {
                userId: "12345678",
            }); //uses the request function that calls on express app instance
        expect(res3.body).toEqual("already deleted");
        expect(res3.status).toEqual(410);
    });

    it("DELETE /user/ - fail - bad input", async () => {
        const res = await request.delete("/user");
        expect(res.status).toEqual(400);
    });


});
