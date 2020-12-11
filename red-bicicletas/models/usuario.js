var mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
var Reserva = require('./reserva');
const bcrypt = require('bcrypt');
const crypto = require('crypto');//no requiere instalacion
const saltRounds = 10;

const Token = require('../models/token');
const mailer = require('../mailer/mailer');

var Schema = mongoose.Schema;

//nombre usuario + @ + servidor + dominio
const validateEmail=function(email) {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
    // if (re.test(email))
    // {
    //     alert("La dirección de email " + valor + " es correcta.");
    // } else 
    // {
    //     alert("La dirección de email es incorrecta.");
    // }
};

var usuarioSchema = new Schema({
    nombre:{
        type: String,
        trim: true,
        required: [true, 'El nombre es obligatorio']
    },
    email: {
        type: String,
        trim: true,
        required:   [true, 'El email es obligatorio'],
        lowercase: true,
        unique: true,
        validate: [validateEmail, 'La dirección de email es incorrecta'],
        match:  [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/]
    },
    password:{
        type:String,
        trim: true,
        required: [true, 'El password es obligatorio']
    },
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    verificado:{
        type: Boolean,
        default: false
    }

});

// usuarioSchema.plugin(uniqueValidator, { message: 'El {PATH} ya existe con otro usuario' });

//antes de guardar/save
usuarioSchema.pre('save', function(next){
    if (this.isModified('password')){
        // this.password = bcrypt.hashSync(this.password, saltRounds);
    }
    next();
});

usuarioSchema.methods.validPassword = function(password) {
    // return bcrypt.compareSync(password, this.password);
}

usuarioSchema.methods.reservar = function(biciId, desde, hasta, cb){
    var reserva = new Reserva({usuario: this._id, bicicleta: biciId, desde: desde, hasta: hasta});
    console.log(reserva);
    reserva.save(cb);
}

usuarioSchema.methods.enviar_email_bienvenida = function(callback){
    const token = new Token({_userId: this.id, token: crypto.randomBytes(15).toString()});
    const email_destination = this.email;
    token.save(function(err){
        if(err){
           return console.log(err.message); 
        }

        const mailOptions = {
            from: 'no-reply@redbicicletas.com',
            to: email_destination,
            subject: 'Verificación de cuenta',
            text: 'Hola,\n\n'+'Por favor, para verificar su cuenta haga click en el siguiente enlace \n' + 'http://localhost:5000' + '\/token/confirmation\/' + token.token + '.\n'
        };

        mailer.sendMail(mailOptions, function(err){
            if(err){
                return console.log(err.message);
            }
            console.log('Para verificar tú cuenta se ha enviado un email al correo ' + email_destination); 
        });
    });
}

module.exports = mongoose.model("Usuario", usuarioSchema); 