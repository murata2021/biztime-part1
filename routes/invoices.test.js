process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db=require("../db");

let company;
let invoices;

beforeEach(async()=>{
    companiesResults=await db.query("INSERT INTO companies VALUES ('apple', 'Apple Computer', 'Maker of OSX.') RETURNING *")
    invoicesResults=await db.query("INSERT INTO invoices (comp_Code, amt, paid, paid_date) VALUES ('apple', 100, false, null), ('apple', 200, false, null), ('apple', 300, true, '2018-01-01') RETURNING *")

    company=companiesResults.rows[0]
    invoices=invoicesResults.rows.map(el=>JSON.parse(JSON.stringify(el)))
    // invoices=invoicesResults.rows

    // console.log(invoices)
    
})

afterEach(async()=>{
    await db.query("DELETE FROM companies")
    await db.query("DELETE FROM invoices")

})

afterAll(async()=>{
    await db.end()
})


describe('GET /invoices',()=>{
    test("Get a list with invoices",async ()=>{
        const res = await request(app).get('/invoices')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({invoices: invoices.map((el)=>({id:el.id,comp_code:el.comp_code}))})
    })
})


describe('GET /invoices/:id',()=>{
    test("Get a single invoice", async ()=>{
        const res=await request(app).get(`/invoices/${invoices[0].id}`)

        expect(res.body).toEqual({invoice:invoices[0],company:company})
    })
    test("Responds with 404 for invalid invoice id",async ()=>{
        const res1= await request(app).get(`/invoices/2312312`)

        expect(res1.statusCode).toBe(404)
    })
})



describe('POST /invoices',()=>{
    test("Create an invoice",async ()=>{
        const res = await request(app).post(`/invoices`).send({comp_code:"apple",amt:1000})
        expect(res.body["invoice"]["comp_code"]).toEqual("apple")
        expect(res.body["invoice"]["amt"]).toEqual(1000)
        expect(res.body["invoice"]["id"]).toEqual(expect.any(Number))

    })

    test("Post request with missing data",async()=>{
        const res = await request(app).post(`/invoices`).send({comp_code:'apple'})
        expect(res.statusCode).toBe(400)
    })

})

describe('PUT /invoices/:id',()=>{
    test("Updates a single invoice",async ()=>{
        const res = await request(app).put(`/invoices/${invoices[0].id}`).send({amt:2000})
        invoices[0].amt=2000
        expect(res.body).toEqual({invoice:invoices[0]})
    })
    
    test("Responds with 404 for invalid id",async ()=>{
        const res = await request(app).put(`/invoices/${312312312}`).send({amt:2000})
        expect(res.statusCode).toBe(404)
    })
    test("Responds with missing data",async ()=>{
        const res = await request(app).put(`/invoices/${312312312}`).send({})
        expect(res.statusCode).toBe(400)
    })

})


describe('DELETE /invoices/:id',()=>{
    test("Delete a single invoice",async ()=>{
        const res = await request(app).delete(`/invoices/${invoices[0].id}`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({status:"DELETED"})
    })

    test("Delete request for non-existent invoice",async ()=>{
        const res = await request(app).delete(`/invoices/${32131232}`)
        expect(res.statusCode).toBe(404)
    })
})




