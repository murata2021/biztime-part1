/** Routes for invoices of biztime */

const express=require("express");
const ExpressError=require("../expressError");
const router=express.Router();
const db=require("../db");

router.get('/',async(req,res,next)=>{
    try{
        const results=await db.query("SELECT id,comp_code FROM invoices")
        return res.json({invoices:results.rows})
    }
    catch(e){
        return next(e)
    }
})


// //GET /invoices/[id]
router.get('/:id',async(req,res,next)=>{

    try{
        const {id}=req.params;
        const results=await db.query('SELECT * FROM invoices WHERE id=$1 ;',[id])
        if(results.rows.length===0){
            throw new ExpressError(`Can't find invoice with id of ${id}`,404)
        }

        const code=results.rows[0].comp_code
        const companyResult=await db.query('SELECT * FROM companies WHERE code=$1',[code])
        return res.json({invoice:results.rows[0],company:companyResult.rows[0]})
    }
    catch (e){
        return next(e)
    }
})

//POST /invoices
router.post('/',async(req,res,next)=>{
    try{
        const {comp_code,amt}=req.body;

        if (!comp_code || !amt ){
            throw new ExpressError('The invoice data format should be {comp_code, amt}')
        }
        const results=await db.query('INSERT INTO invoices (comp_code,amt) VALUES ($1,$2) RETURNING *',[comp_code,amt])
        return res.json({invoice:results.rows[0]})
    }
    catch(e){
        return next(e)
    }
})

//PUT /invoices/[id]
router.put('/:id',async(req,res,next)=>{
    try{

        const {id}=req.params;
        const {amt}=req.body;

        if (!amt){
            throw new ExpressError('The data format should be {amt}')
        }
        const results=await db.query('UPDATE invoices SET amt=$2 WHERE id=$1 RETURNING *',[id,amt])
        if (results.rows.length===0){
            throw new ExpressError(`Can't find invoice with id of ${id}`,404)
        }
        return res.json({invoice:results.rows[0]})
    }
    catch(e){
        return next(e)
    }
})

// //DELETE /invoices/[id]
router.delete("/:id",async(req,res,next)=>{

    try{
        const {id}=req.params;

        const results2=await db.query('SELECT * FROM invoices WHERE id=$1 ;',[id])
        if(results2.rows.length===0){
            throw new ExpressError(`Can't find invoice with code of ${id}`,404)
        }
        const results=await db.query('DELETE FROM invoices WHERE id=$1',[id])
        return res.send({status:'DELETED'})
    }
    catch(e){
        return next(e)
    }
})


module.exports=router;
