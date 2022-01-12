/** Routes for companies of biztime */

const express=require("express");
const ExpressError=require("../expressError");
const router=express.Router();
const db=require("../db");
const e = require("express");


//GET /industries
router.get('/',async(req,res,next)=>{

    try{
        const results=await db.query('SELECT * FROM industries ;')
        return res.json({industries:results.rows})
    }
    catch (e){
        return next(e)

    }
})

//GET /industry/:code
router.get('/:code',async(req,res,next)=>{

    try{
        const {code}=req.params;

        // const results=await db.query('SELECT * FROM industries WHERE code=$1 ;',[code])

        const results=await db.query(`SELECT * FROM industries AS ind 
        LEFT JOIN companies_industries AS comp_ind
        ON ind.code=comp_ind.ind_code
        LEFT JOIN companies AS comp
        ON comp.code=comp_ind.comp_code
        WHERE ind.code=$1 `,[code])

        if(results.rows.length===0){
            throw new ExpressError(`Can't find industry with code of ${code}`,404)
        }

        const {industry,ind_code}=results.rows[0]
        const companies=results.rows.map((el)=>({code:el.code,comp_name:el.name,description:el.description}))
        return res.json({code,industry,companies})
        
    }
    catch (e){
        return next(e)
    }
})

//POST /industries
router.post('/',async(req,res,next)=>{
    try{
        let {code,industry}=req.body;

        if (!code || !industry){
            throw new ExpressError('The industry data format should be {code, industry}',400)
        }
        const results=await db.query('INSERT INTO industries (code,industry) VALUES ($1,$2)',
        [code,industry])

        return res.json({industry:{code:code,industry:industry}})
    }
    catch(e){
        return next(e)
    }
})

//POST /industries/:code/add
router.post('/:code/add',async(req,res,next)=>{
    try{
        let {code}=req.params;
        let {company_code}=req.body;

        if (!code){
            throw new ExpressError(`Can't find industry with code of ${code}`,404)
        }

        const checkCompany=await db.query('SELECT * FROM companies WHERE code=$1',[company_code])
        if(checkCompany.rows.length===0){
            throw new ExpressError(`Company with the code: ${company_code} doesn't exist`,404)
        } 
        const results=await db.query('INSERT INTO companies_industries (comp_code,ind_code) VALUES ($1,$2)',
        [company_code,code])

        return res.json("successful")
    }
    catch(e){
        return next(e)
    }
})


module.exports=router;
