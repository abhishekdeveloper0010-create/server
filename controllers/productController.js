const Product = require("../models/productModel");

exports.getAllProducts = (req, res) => {

    Product.getProducts((err, results)=>{

        if(err){
            return res.status(500).json({
                error: err
            });
        }

        res.json(results);

    });

};