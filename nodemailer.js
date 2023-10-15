const nodemailer = require('nodemailer')
const googleApis = require('googleapis')

const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID =   `142707453780-gjqer98213dridmcukqui3ev925oos2a.apps.googleusercontent.com`
const CLIENT_SECRET = `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`
const REFRESH_TOKEN = `1//04H4Vrwl4ovE3CgYIARAAGAQSNwF-L9IrR4QUi4K7LreatW0h_2ITLOv8EC5BakwLF-2MzMRcoiqNkwl_ala5hwH6LY8rAiSDggk`

const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
authClient.setCredentials({refresh_token : REFRESH_TOKEN})

async function mailer(recieverEmail, id, key){
    try{
        const ACCESS_TOKEN = await authClient.getAccessToken();

        const transport = nodemailer.createTransport({
            service : "gmail",
            auth : {
             type : 'OAuth2',
             user : "shukla09akash@gmail.com",
             clientId : CLIENT_ID,
             clientSecret : CLIENT_SECRET,
             refreshToken : REFRESH_TOKEN,
             accessToken : ACCESS_TOKEN
           
            }
        })

        const details = {
            from : "Akash Shukla <shukla09akash@gmail.com>",
            to : recieverEmail,
            subject : "hey there is forget password link",
            text : "there we go learning nodemailer",
            html : `<h3>hamne aapko reset password link bheja hai <a href = "http://localhost:3000/forgot/${id}/${key}">http://localhost:3000/${id}/${key}</a></h3>`
        }
        const result =  await transport.sendMail(details)
        return result ;
    }
       catch(err){
        return err
       }
}

// normal fn se code nhi chl rha pta nhi kyu? 
// mailer().then( function(req,res){
//     console.log("email sent" , res);
// })


// mailer().then( res =>{
//     console.log("send mail !", res);
//   })

// function hello(name){
//     console.log("hello" + this.name)
// }

module.exports = mailer;