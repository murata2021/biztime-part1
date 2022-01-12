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
    // console.log(company)
    invoices=invoicesResults.rows.map(el=>JSON.parse(JSON.stringify(el)))

    // console.log(invoices)
    
})

afterEach(async()=>{
    await db.query("DELETE FROM companies")
    await db.query("DELETE FROM invoices")

})

afterAll(async()=>{
    await db.end()
})


describe('GET /companies',()=>{
    test("Get a list with companies",async ()=>{
        const res = await request(app).get('/companies')
        // expect(res.statusCode).toBe(200)
        // expect(res.body).toEqual({users:[testUser]})
        expect(res.body).toEqual({companies:[{code:company.code,name:company.name}]})
    })
})


describe('GET /companies/:code',()=>{
    test("Get a single company", async ()=>{
        const res=await request(app).get(`/companies/${company.code}`)
        expect(res.body).toEqual({company:company,invoices:invoices})
    })
    test("Responds with 404 for invalid company code",async ()=>{
        const res1= await request(app).get(`/companies/fakeCompany`)
        expect(res1.statusCode).toBe(404)
    })
})


describe('POST /companies',()=>{
    test("Create a company",async ()=>{
        const res = await request(app).post(`/companies`).send({code:'ibm',name:'IBM',description:'Big blue.'})
        // expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({company:{code:"ibm",name:'IBM',description:'Big blue.'}})
    })

    test("Post request with missing data",async()=>{
        const res = await request(app).post(`/companies`).send({name:'fakeCo',description:'Fake Corp.'})
        expect(res.statusCode).toBe(400)
    })

})


describe('PUT /companies/:code',()=>{
    test("Updates a single company",async ()=>{
        const res = await request(app).put(`/companies/${company.code}`).send({name:"apple",name:"APPLE",description:"testing put request"})
        expect(res.body).toEqual({company:{code:company.code,name:"apple",name:"APPLE",description:"testing put request"}})
    })
    
    test("Responds with 404 for invalid code",async ()=>{
        const res = await request(app).put(`/users/fakeCorp`).send({name:"APPLE",description:"testing incorrect put request"})
        expect(res.statusCode).toBe(404)
    })
    test("Responds with missing data",async ()=>{
        const res = await request(app).put(`/companies/${company.code}`).send({name:"APPLE"})
        expect(res.statusCode).toBe(400)
    })

})

describe('DELETE /companies/:code',()=>{
    test("Delete a single company",async ()=>{
        const res = await request(app).delete(`/companies/${company.code}`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({status:"DELETED"})
    })

    test("Delete request for non-existent company",async ()=>{
        const res = await request(app).delete(`/companies/fakeCorp`)
        expect(res.statusCode).toBe(404)
    })

})

