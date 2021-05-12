const express = require("express");
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const app = express();
const session = require('express-session');
const pool = dbConnection();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'topsecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

//routes

// ----- Root Route -----
app.get("/", async function(req, res){
    let sql = `SELECT productId, productName, productLocation, productDescription,                    imageURL 
               FROM q_products`;
    let rows = await executeSQL(sql);
    res.render("index", {"products":rows});
});

// ----- Keyword Search Page -----
app.get("/searchByKeyword", async function(req, res){
  let keyword = req.query.keyword;

  let sql = `SELECT productId, productName, productLocation, productDescription,                      imageURL
             FROM q_products 
             WHERE productName LIKE ? `;

  let params = [`%${keyword}%`];

  let rows = await executeSQL(sql, params);
  res.render("searchResult", {"product":rows});
});

// ----- Product Page -----
app.get("/productPage", async function(req, res){
  let sql = `SELECT * FROM q_products WHERE productId=${req.query.product_Id}`;
  let rows = await executeSQL(sql);

  let sql2 = `SELECT * FROM q_comments WHERE productId=${req.query.product_Id}`;
  let rows2 = await executeSQL(sql2);

  res.render('productPage', {"product":rows, "comment":rows2});
});

// ----- Add Comment/Review -----
app.post("/comment/new", async function(req, res){
    if(req.session.authenticated) {
        let productId_ = req.body.product_Id_;
        let comment = req.body.review;
        let commentUser = req.body.commentUser;
    

        let sql = "INSERT INTO q_comments (productId, comment, commentUserName) VALUES (?, ?, ?)";

        let params = [productId_, comment, commentUser];
        let rows = await executeSQL(sql, params)

        res.redirect(`/productPage?product_Id=${productId_}`);
    } else {
        res.redirect("/login");
    }
});

// ----- API for Product -----
app.get("/api/getproductPage", async function(req, res){
  let productId = req.query.productId;

  let sql = `SELECT * FROM q_products 
             NATURAL JOIN q_users
             WHERE productId = ${productId}`;
  let rows = await executeSQL(sql);
  res.send(rows);
});

// ---- API for Add to Fav
app.get("/productPage/addFav", async function(req, res){

    if(req.session.authenticated) {
        let productId = req.query.productId;

        let sql = `SELECT * FROM q_products 
                   WHERE productId = ${productId}`;
        let rows = await executeSQL(sql);

        let productName_ = rows[0].productName;
        let imageURL_ = rows[0].imageURL;
        let productDescription_ = rows[0].productDescription;
        let userId_ = req.session.userId;

        let sql2 = `INSERT INTO q_saved (productId,productName, userId,imageUrl, productDescription) VALUES (?,?,?,?,?)`;

        let params = [productId, productName_, userId_, imageURL_, productDescription_];
        let rows2 =  await executeSQL(sql2, params);

        res.redirect('/')
    } else {
        res.redirect("/login");
    }
});

//--------favorites-----------
app.get("/favorites", async function(req, res){
  if(req.session.authenticated) {
        let userId_ = req.session.userId;
    
        let sql = `SELECT savedId, productId, productName, productDescription,                        imageUrl 
                   FROM q_saved 
                   WHERE userId = ${userId_}`;
        let rows = await executeSQL(sql);
        res.render("favorites", {"products":rows});
    } else {
        res.redirect("login");
    }
});

// ----- User Product Page -----
app.get("/userProducts", async function(req, res){
    if(req.session.authenticated) {
        let userId_ = req.session.userId;
        let sql = `SELECT productId, productName, productLocation, productDescription,                    imageURL 
                FROM q_products
                WHERE userId = ${userId_}`;
        let rows = await executeSQL(sql);
        res.render("userProducts", {"products":rows});
    } else {
        res.redirect("login");
    }
});

// --- Update products ----
app.get("/product/edit", async (req, res) => {
    let productId = req.query.productId;
    let sql = `SELECT * FROM q_products WHERE productId = ${productId}`;
    let rows = await executeSQL(sql);

    let sqlC = `SELECT DISTINCT productCategory FROM q_products ORDER BY productCategory` 
    let rowsC = await executeSQL(sqlC);
    res.render("updateProducts", {"editPost":rows, "categories":rowsC});
});

// ----- Update Product POST -----
app.post("/product/edit", async function(req, res){
  let productId = req.body.productId;
  let sql = `UPDATE q_products
             SET productName = ?,
                 productLocation = ?, 
                 productDescription = ?,
                 productReviews = ?,
                 imageURL = ?,
                 productCategory = ?
              WHERE productId = ${productId}`;

    let params = [req.body.productName_, req.body.location, req.body.description, 0, req.body.image, req.body.category];
    let rows = await executeSQL(sql, params);
    res.redirect("/")
});

//---- Product Delete ----
app.get("/product/delete", async function(req, res){
  let productId = req.query.productId;
  let sql = `DELETE
             FROM q_products
             WHERE productId =  ${productId}`;
  let rows = await executeSQL(sql);
  res.redirect("/userProducts");
});

//---- Saved Delete ----
app.get("/saved/delete", async function(req, res){
  let savedId = req.query.savedId;
  let sql = `DELETE
             FROM q_saved
             WHERE savedId =  ${savedId}`;
  let rows = await executeSQL(sql);
  res.redirect("/favorites");
});

// ----- Add Post GET -----
app.get("/addPost", async (req, res) => {
    let a = true;
     if(req.session.authenticated) {
    //if(a) {
        let sql = "SELECT DISTINCT productCategory FROM q_products ORDER BY productCategory";
        let rows = await executeSQL(sql);
        res.render('addPost', {"categories": rows});
    } else {
        res.redirect("login");
    }
});

// ----- Add Post POST -----
app.post("/addPost", async (req, res) => {
    if(req.session.authenticated) {
        let productName_ = req.body.title;
        let location_ = req.body.location;
        let description_ = req.body.description;
        let reviews_ = 0;
        let image_ = req.body.image;
        let category_ = req.body.category;
        let userId_ = req.session.userId;
        
        let sql = "INSERT INTO q_products (productName, productLocation, productDescription, userId, productReviews, imageURL, productCategory) VALUES (?, ?, ?, ?, ?, ?, ?)";
        let params = [productName_, location_, description_, userId_, reviews_, image_, category_];
        let rows = await executeSQL(sql, params);
        res.redirect("/");
    } else {
        res.redirect("login");
    }
});

//middleware functions
function isAuthenticated(req, res, next){
  //checks whether the user is not authenticated
  if (!req.session.authenticated) {
    res.redirect("/");
  } else {
    next();
  }
}

// ---- Logout ----
app.get("/logout", isAuthenticated, function(req, res){
  req.session.destroy();
  res.redirect("/");
});

// ----- Login -----
app.get("/login", function(req, res){
  res.render("login", {"error":""});
});

// ----- Login post method -----
app.post("/login",  async function(req, res){
  let username = req.body.username;
  let password = req.body.password;
  let hashedPwd = "";

  let sql = "SELECT * FROM q_users WHERE username = ?";  
  let rows = await executeSQL(sql, [username]);

  if (rows.length > 0) {
    // hashedPwd = "$2a$10$Zr7WyM2tGnm3rIL0rgC5GelS9FCGkWz0ZmzfZBRCi.I5wx0oSgogW";
     hashedPwd = rows[0].password;
  }

  let pwdMatch = await bcrypt.compare(password, hashedPwd);

  if (pwdMatch) {
     req.session.authenticated = true;
     req.session.userId = rows[0].userId;
     res.redirect("/"); 
  } else {
    res.render("login", {"error":"wrong credentials"});
  }
});

// ----- Signup POST method -----
app.post("/signup",  async function(req, res){
  let firstName = req.body.suFirstName;
  let lastName = req.body.suLastName;
  let username = req.body.suUsername;
  let password = req.body.suPassword;
  let email = req.body.suEmail;
  let phone = req.body.suPhone;
  
  let hashedPwd_ = await bcrypt.hash(password, 10);
  let pwdMatch = await bcrypt.compare(password, hashedPwd_);

  if (pwdMatch) {
    let sql = "INSERT INTO q_users (username, firstName, lastName, userEmail, userPhone, password) VALUES (?, ?, ?, ?, ?, ?)";
    let params = [username, firstName, lastName, email, phone, hashedPwd_];
    let rows = await executeSQL(sql, params);
     res.redirect("/login");
  } else {
    res.render("login", {"error":"wrong credentials"});
  }
});


app.get("/dbTest", async function(req, res){

let sql = "SELECT CURDATE()";
let rows = await executeSQL(sql);
res.send(rows);
});//dbTest

//functions
async function executeSQL(sql, params){
return new Promise (function (resolve, reject) {
pool.query(sql, params, function (err, rows, fields) {
if (err) throw err;
   resolve(rows);
});
});
}//executeSQL
//values for the heroku jawsDB
function dbConnection(){

   const pool  = mysql.createPool({
      connectionLimit: 10,
      host: "grp6m5lz95d9exiz.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
      user: "qskgfcm28s670u7z",
      password: "rvq4vp6nj97i5acj",
      database: "e6ioc2xy0ezubc55"

   }); 

   return pool;

} //dbConnection

//start server
app.listen(3000, () => {
console.log("Expresss server running...")
} )