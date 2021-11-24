const MapsData = require("../../models/map");

const getMapData = (req, res) => {
  MapsData.find((err, result) => {
    console.log(err);
    res.status(200).json(result);
  });
};

module.exports = getMapData;

// router.get('/api/groups',function(req,res,next){
//   Group.find(function(err, group) {
//       if (err) { return next(err); }
//       console.log(group)
//       res.status(201).json(group);
//   })
// })
