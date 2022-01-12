/** Routes for companies of biztime */

const express=require("express");
const ExpressError=require("../expressError");
const router=express.Router();
const db=require("../db");

const slugify=require("slugify")

//GET /companies
router.get('/',async(req,res,next)=>{

    try{
        const results=await db.query('SELECT code,name FROM companies ;')
        return res.json({companies:results.rows})
    }
    catch (e){
        return next(e)


    }
})

//GET /companies/[code]
router.get('/:code',async(req,res,next)=>{

    try{
        const {code}=req.params;
        // const results=await db.query('SELECT * FROM companies WHERE code=$1 ;',[code])

        const results=await db.query(`SELECT * FROM companies AS comp
        LEFT JOIN companies_industries AS comp_ind ON comp.code=comp_ind.comp_code
        LEFT JOIN industries as ind ON comp_ind.ind_code=ind.code
        WHERE comp.code=$1 `,[code])


        if(results.rows.length===0){
            throw new ExpressError(`Can't find company with code of ${code}`,404)
        }
        const invoicesResults=await db.query('SELECT * FROM invoices WHERE comp_code=$1',[code])
        const {name,description}=results.rows[0]
        const industries=results.rows.map((el)=>el.industry)
        return res.json({company:{code,name,description,industries,invoices:invoicesResults.rows}})
    }
    catch (e){
        return next(e)
    }
})

//POST /companies
router.post('/',async(req,res,next)=>{
    try{
        let {code,name,description}=req.body;

        if (!code || !name || !description){
            throw new ExpressError('The company data format should be {code, name, description}',400)
        }
        name=slugify(name,{lower: true,remove: /[*+~.()'"!:@]/g})
        const results=await db.query('INSERT INTO companies (code,name,description) VALUES ($1,$2,$3)',
        [code,name,description])
        return res.json({company:{code,name,description}})
    }
    catch(e){
        return next(e)
    }
})
//PUT /companies/[code]
router.put('/:code',async(req,res,next)=>{
    try{

        const {code}=req.params;
        const {name,description}=req.body;

        if (!name || !description){
            throw new ExpressError('The company data format should be {name, description}',400)
        }

        const results=await db.query('UPDATE companies SET name=$2,description=$3 WHERE code=$1 RETURNING *',[code,name,description])
        if (results.rows.length===0){
            throw new ExpressError(`Can't find company with code of ${code}`,404)
        }
        return res.json({company:results.rows[0]})
    }
    catch(e){
        return next(e)
    }
})

//DELETE /companies/[code]
router.delete("/:code",async(req,res,next)=>{

    try{
        const {code}=req.params;

        const results2=await db.query('SELECT * FROM companies WHERE code=$1 ;',[code])
        if(results2.rows.length===0){
            throw new ExpressError(`Can't find company with code of ${code}`,404)
        }

        const results=await db.query('DELETE FROM companies WHERE code=$1',[code])
        return res.send({status:'DELETED'})
    }
    catch(e){
        return next(e)
    }
})


module.exports=router;
