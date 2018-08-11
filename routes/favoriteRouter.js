const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorites');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({ 'user': req.user._id })
    .populate('user')
    .populate('dishes')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, 
(req, res, next) => {
    var inputDishes = [];
    for (var i = (req.body.length -1); i >= 0; i--) {
        inputDishes[i] = req.body[i]._id;
    };
    console.log("Dishes array = ", inputDishes);
    Favorites.findOne({'user': req.user._id})
    .then((favorites) => {
        if(!favorites) {
            Favorites.create({ 'user': req.user._id, 'dishes': inputDishes})
            .then((favorites) => {
                console.log('Favorite created ', favorites);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
        } else {
            Favorites.findOneAndUpdate({'user': req.user._id}, 
            { "$addToSet": { 'dishes': { "$each": inputDishes }}}, {new: true}, function(err, favorite) {
                if (err) throw err;
                console.log("Favorite updated");
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
              }
            );
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log('Deleting /favorites/ for  ' + req.user._id);
    Favorites.findOneAndRemove({ 'user': req.user._id }, function(err, favorite) {
        if (err) throw err;
        console.log("1 document deleted");
        console.log(favorite);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
      }
    );
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/'+ req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndUpdate({ 'user': req.user._id }, 
    {"$addToSet": {'dishes': req.params.dishId}}, {new: true}, function(err, favorite) {
        if (err) throw err;
        console.log("Favorites deleted");
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
      }
    );
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/'+ req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ 'user': req.user._id })
    .then((favorite) => {
        if (favorite != null) {
            console.log('Deleting ' + req.params.dishId);
            console.log('Dishes: '+ favorite.dishes + ' type array ' + typeof(favorite.dishes) + 
            ' type dish \n' + typeof(favorite.dishes[0]));
            Favorites.findOneAndUpdate({'user': req.user._id}, 
            {"$pull": {'dishes': req.params.dishId}}, {new: true}, function(err, favorite) {
                if (err) throw err;
                console.log("1 document deleted");
                console.log(favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            });
        } else {
            err = new Error('No favorites have been created');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;
