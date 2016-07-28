'use strict';

const PokemonGO = require('./node_modules/pokemon-go-node-api/poke.io.js');
const notifier = require('node-notifier');
const path = require('path');
var jsonfile = require('jsonfile');
var pokemons = require('./pokemon.fr.json');
const pkg = require('./package.json');

const Configstore  = require('configstore');
const conf = new Configstore(pkg.name);
const prompt = require('prompt');

console.log(conf.all);

var a = new PokemonGO.Pokeio();
var active = true;
var distanceMax = 200;              // En metres
var delai = 60*5;                   // En secondes
var enableNotification = true;      // Active les notifications

if (Object.keys(conf.all).length == 0) {
    setAdresse();
} else {
    promptSetAdresse();
}

function promptSetAdresse(){
    prompt.start();
    var schema = {
        properties: {
            choix: {
                pattern: /^[yYnN]{1}$/,
                description: 'Changer l\'adresse "'+conf.get('adresse')+'"[Y/N]',
                required: true,
                type: 'string'
            }
        }
    };
    prompt.get(schema, function (err, result) {
        if (result.choix.toLowerCase() == 'y') {
            setAdresse();
        } else {
            startSearch();
        }
    });
}

function setAdresse(){
    prompt.start();
    var schema = {
        properties: {
            adresse: {
                description: 'Taper une adresse',
                required: true,
                type: 'string'
            }
        }
    };
    prompt.get(schema, function (err, result) {
        conf.set('adresse', result.adresse);

        startSearch();
    });
}

function startSearch(){

//Set environment variables or replace placeholder text
    var location = {
        type: 'name',
        name: conf.get('adresse')
    };

    var username = 'pokemonApiRadar';
    var password = 'pokemonRadar';
    var provider = 'ptc';

    if (active) {
        a.init(username, password, location, provider, function (err) {
            if (err) throw err;

            console.log('1[i] Current location: ' + a.playerInfo.locationName);
            console.log('1[i] lat/long/alt: : ' + a.playerInfo.latitude + ' ' + a.playerInfo.longitude + ' ' + a.playerInfo.altitude);

            a.GetProfile(function (err, profile) {
                if (err) throw err;

                console.log('1[i] Username: ' + profile.username);

                check();

                setInterval(function () {
                    check();
                }, delai * 1000);

            });
        });
    }
}

function check(){
  a.Heartbeat(function(err,hb) {
    if(err) {
      console.log(err);
    }

    if (hb != undefined) {
        for (var i = hb.cells.length - 1; i >= 0; i--) {
            if (hb.cells[i].NearbyPokemon[0]) {
                var pokemonIndex = parseInt(hb.cells[i].NearbyPokemon[0].PokedexNumber) - 1;
                var pokemon = a.pokemonlist[pokemonIndex];
                var distance = hb.cells[i].NearbyPokemon[0].DistanceMeters;
                var message = 'Un ' + pokemons[pokemonIndex + 1] + ' est à ' + distance + ' mètres!';

                console.log(message);

                // Si le Pokémon est à distance
                if (enableNotification && distance <= distanceMax) {
                    notifier.notify({
                        title: 'Pokemon GO',
                        message: message,
                        icon: path.join(__dirname, 'images/' + pokemon.num + '.png')
                    });
                }
            }
        }
    }

  });
}
