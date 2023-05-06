const express = require('express');
const LearnerData = require('../model/learner')
var router = express.Router()
const jwt = require('jsonwebtoken')

function verifyToken(req,res,next){
    try {
        console.log(req.headers.authorisation)
        if(!req.headers.authorisation) throw('unauthorized auth')
        let token=req.headers.authorisation.split(' ')[1] 
        if(!token) throw('unauthorized jwt')
        let payload=jwt.verify(token,'ilikeapples')
        if(!payload) throw('unauthorized payload') 
       // res.status(200).send(payload) 
        next()    
    } catch (error) {
        console.log(error)
        res.status(401).send(error)
    }
  
  }
  //learners
router.get('/',async(req,res)=>{
 
    try {
        
    let learners =  await LearnerData.find()
    res.json({data:learners,message:"success"}).status(200)


    } catch (error) {
        console.log(error)
        res.json({message:error}).status(400)
    }

})
router.get('/:id',async(req,res)=>{
  try {
      let id = req.params.id;
      let learners = await LearnerData.findById(id);
      res.send(learners);
  }
  catch(error) {
      console.log(error);
  }
})
router.post('/',verifyToken,async(req,res)=>{

    try {
        let learner = req.body
        let checklearner= req.body.learnerid
        console.log(checklearner)
        let existingLearner = await LearnerData.findOne({ learnerid: checklearner});
        if (existingLearner) {
          // If learner already exists, return an alert message
          console.log("checked learner")
           res.status(400).json({ message: 'Learner already exists' });
        }
        else{
        let data = new LearnerData(learner)
        await data.save()
        res.json({ message: 'Data saved successfully' }).status(201) }
        
    } catch (error) {
        console.log(error)
     res.json({message:error}).status(400)
        
    }
})



router.put('/:id',async(req,res)=>{
  
  try {
    let id = req.params.id;
    let learner=req.body;
    let update= { $set: learner };
    const updatedLearner = await LearnerData.findByIdAndUpdate({_id:id},update)
    res.send(updatedLearner)
  } catch (error) {
    console.log(error)
    res.json({message:error}).status(400)
  }


})

router.delete('/:id',verifyToken,async(req,res)=>{
  try {

    
    let id = req.params.id
    await LearnerData.findByIdAndDelete({_id:id})
    res.json({message :'Data deleted succesfully'}).status(200)

    
  } catch (error) {
    console.log(error)
    res.json({message:error}).status(400)
    
  }
})

//TO upload csv file from frontend and store it in mongodb

const multer = require('multer');
const bodyparser = require('body-parser');
const csvtojson = require('csvtojson');


var path = require('path')
router.use(bodyparser.urlencoded({extended:true}))


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
  })
  
  var upload = multer({ storage: storage }).single('file');
  router.use(express.static('uploads'))
  
  router.post('/file', (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        console.log(err)
        res.status(500).json({ message: 'Error uploading file' });
      } else {
        console.log(req.file.path)
        const jsonArray = await csvtojson().fromFile(req.file.path);
        try {
          const result = await LearnerData.insertMany(jsonArray); // save to MongoDB
          res.status(201).json({ message: 'File uploaded successfully', result });
        } catch (err) {
          console.log(err);
          res.status(500).json({ message: 'Error saving data to database' });
        }
      }
    })
  })
  //get single learner to display in update form
router.get('/:id',async(req,res)=>{
  try {
      let id = req.params.id
      let learner = await LearnerData.findOne({_id:id});
     res.json({data:learner,message:"success"}).status(200)

  } catch (error) {
      console.log(error)
      res.json({message:error}).status(400)
  }
})




module.exports= router