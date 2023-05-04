const express = require('express')
const LearnerData=require('../model/learner')
const userData= require('../model/sitemanagers') // DB of signup
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt =require('jsonwebtoken')


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
const saltRounds = 10; // Number of salt rounds to use for the hash



let token = '';
router.post('/auth', async (req, res) => {
  try {
    const loginemail = req.body.email;
    const loginpassword = req.body.password;
    const user = await userData.findOne({ email: loginemail }).exec();

    if (loginemail == 'admin' && loginpassword == '1234') {

      let payload = {loginemail:loginemail,loginpassword:loginpassword}
        let token=jwt.sign(payload,'ilikeapples')
        console.log(token)

      console.log("admin login success");
      res.send({ status: true, data: loginemail,token:token });
      
    } else if (user) {
      
      
      bcrypt.compare(loginpassword, user.password, (err, result) => {
        console.log(loginemail)
        if (err) {
          console.error(err);
          res.status(500).send('Error comparing passwords');
        } else if (result) {
          
          let payload = {loginemail:loginemail,loginpassword:loginpassword}
          let token=jwt.sign(payload,'ilikeapples')
          console.log(token)
          console.log('user login success');
          res.send({ status: true, data: user.role,token:token });
        } else {
          res.status(401).json({
            status: false,
            message: 'Authentication failed. Invalid password.',
          });
        }
      });
    } else {
      res.status(401).json({
        status: false,
        message: 'Authentication failed. User not found.',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error in authentication');
  }
});


//SiteManagers

const staffInfo = require('../model/sitemanagers')

//read staff list 
router.get('/stafflist', async(req,res)=>{
    try {
        const list = await staffInfo.find();
        res.send(list);
    }
    catch(error) {
        console.log(error);
    }
})

// read single staff detail
router.get('/staff/:id',async(req,res)=>{
    try {

        let id = req.params.id;
        let staff = await staffInfo.findById(id);
        res.send(staff);
    }
    catch(error) {
        console.log(error);
    }
})

// add new staff
router.post('/staff', verifyToken, async (req, res) => {
  try {
    console.log(req.body);
    const checkuser = req.body.email;
    console.log(checkuser);
    const userexist = await userData.findOne({ email: checkuser }).exec();
    console.log(userexist);
    if (userexist !== null) {
      console.log('User already exists');
      return res.status(400).json({ message: 'User already exists' });
    } else {
      bcrypt.hash(req.body.password, 10, function (err, hash) {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        const staffnew = {
          name: req.body.name,
          email: req.body.email,
          password: hash,
          role: req.body.role,
        };
        const token = req.headers.authorization;
        console.log('Token from frontend', token);
        const staff = new staffInfo(staffnew);
        const saveStaff = staff.save();
        return res.send(saveStaff);
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


// update staff detail
router.put('/staff/:id', async(req, res) => {


    try {
      let id = req.params.id;
        console.log(id)
        bcrypt.hash(req.body.password, 10, async function(err, hash) {
        let staff ={
            name: req.body.name,
            email: req.body.email,
             password: hash,
            role : req.body.role
        }
        let updateStaff = { $set: staff };
        let updateInfo = await staffInfo.findByIdAndUpdate({'_id': id }, updateStaff);
        res.send(updateInfo)
        }) 
      } 
     catch (error) {
        console.log(error);
    }
})

// delete staff detail
router.delete('/staff/:id',verifyToken, async(req,res)=>{
    try {
        let id = req.params.id;
        let deleteStaff = await staffInfo.deleteOne({'_id':id});
        res.send(deleteStaff);
    }
    catch(error) {
        console.log(error);   
    }
})
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



router.put('/:id',verifyToken,async(req,res)=>{
  
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
  
  router.post('/file',verifyToken, (req, res) => {
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