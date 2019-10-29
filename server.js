// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')


var public_dir = path.join(__dirname, 'public');
var template_dir = path.join(__dirname, 'templates');
var db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

var app = express();
var port = 8000;

// open usenergy.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
		TestSQL();
    }
});
function TestSQL()
{
     /*   db.all('SELECT * FROM Consumption WHERE year = ? ORDER BY state_abbreviation',['1960'],(err,rows) =>{
			rows.forEach(function (row) {
				console.log(row.state_abbreviation,row.year);
		})
		
	});*/
	
}

app.use(express.static(public_dir));


// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        let response = template;
		var stringHold = "";
    var coal =0;
    var gas =0;
    var nuclear =0;
    var petroleum =0;
    var renew =0;

		var replacePromise= new Promise((resolve,reject)=>{
			db.all("SELECT * FROM Consumption WHERE year = 2017", (err,rows) =>{
				rows.forEach(function (row) {
					stringHold=stringHold+"<tr>"+"<td>"+row.state_abbreviation+"</td>" +"<td>"+row.coal+"</td>"+"<td>"+row.natural_gas+"</td>"+"<td>"+row.nuclear+"</td>"+"<td>"+row.petroleum+"</td>"+"<td>"+row.renewable+"</td>"+"</tr>";
          coal = coal + row.coal;
          gas = gas + row.natural_gas;
          nuclear = nuclear + row.nuclear;
          petroleum = petroleum + row.petroleum; 
          renew = renew = row.renewable; 

					})
					resolve(stringHold);
			});
		})
			replacePromise.then(data=>{
				response=response.replace("replace",data);
        response=response.replace("var coal_count;", "var coal_count = "+ coal + ";");
        response=response.replace("var natural_gas_count;", "var natural_gas_count = "+ gas + ";");
        response=response.replace("var nuclear_count;", "var nuclear_count = " + nuclear + ";");
        response=response.replace("var petroleum_count;", "var petroleum = "+petroleum + ";");
        response=response.replace("var renewable_count;", "var renewable_count = "+ renew + ";");
				WriteHtml(res, response);
			});
			
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
        let response = template;
		let year = req.url.substring(6);
		var stringHold = "";
    var coal =0;
    var gas =0;
    var nuclear =0;
    var petroleum =0;
    var renew =0;
	let prev;
	let next;
				prev=req.url.substring(0,6)+(parseInt(year)-1);
				next=req.url.substring(0,6)+(parseInt(year)+1);
		var replacePromise= new Promise((resolve,reject)=>{
			if(year=="2017")
			{
				next = req.url;
				prev=req.url.substring(0,6)+(parseInt(year)-1);
			}
			if(year == "1960")
			{
				prev=req.url;
				next=req.url.substring(0,6)+(parseInt(year)+1);
			}
			db.all('SELECT * FROM Consumption WHERE year = ? ORDER BY state_abbreviation',[year],(err,rows) =>{
				rows.forEach(function (row) {
          coal = coal + row.coal;
          gas = gas + row.natural_gas;
          nuclear = nuclear + row.nuclear;
          petroleum = petroleum + row.petroleum; 
          renew = renew = row.renewable; 
					total=row.coal+row.natural_gas+row.nuclear+row.petroleum+row.renewable;
					stringHold=stringHold+"<tr>"+"<td>"+row.state_abbreviation+"</td>" +"<td>"+row.coal+"</td>"+"<td>"+row.natural_gas+"</td>"+"<td>"+row.nuclear+"</td>"+"<td>"+row.petroleum+"</td>"+"<td>"+row.renewable+"</td>"+"<td>"+total+"</td>"+"</tr>";
					})
					resolve(stringHold);
			});
		})
			replacePromise.then(data=>{
			response = response.replace('<a class="prev_next" href="prev">Prev</a>','<a class="prev_next" href='+prev+">Prev</a>");  
			response = response.replace('<a class="prev_next" href="next">Next</a>','<a class="prev_next" href='+next+">Next</a>"); 
			
				response=response.replace("replace",data);
				response= response.replace("In Depth Analysis", "In Depth Analysis of "+year);
        response=response.replace("var year;" , "var year = " + year); 
        response=response.replace("var coal_count;", "var coal_count = "+ coal + ";");
        response=response.replace("var natural_gas_count;", "var natural_gas_count = "+ gas + ";");
        response=response.replace("var nuclear_count;", "var nuclear_count = " + nuclear + ";");
        response=response.replace("var petroleum_count;", "var petroleum = "+petroleum + ";");
        response=response.replace("var renewable_count;", "var renewable_count = "+ renew + ";");

				WriteHtml(res, response);
			});
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
		let state=req.url.substring(7);
		let stringHold="";
		let stateName;
		let stateArr= [];
		let stateBefore;
		let stateAfter;
		let coal_counts=[58];
		let natural_counts=[58];
		let petroleum_counts=[58];
		let renewable_counts=[58]; 
		let nuclear_counts =[58];

		var replacePromise= new Promise((resolve,reject)=>{
			db.all('SELECT * FROM States ORDER BY state_abbreviation',(err,rows)=>{rows.forEach(function (row){stateArr.push(rows.state_abbreviation)});});
			
			db.each('SELECT * FROM States WHERE state_abbreviation = ?',[state],(err,rows)=>{stateName= rows.state_name});
			db.all('SELECT * FROM Consumption WHERE state_abbreviation = ? ORDER BY year',[state],(err,rows) =>{
				var count = 0;
				rows.forEach(function (row) {

					coal_counts[count]=row.coal;
					natural_counts[count] = (row.natural_gas);
					nuclear_counts[count] = (row.nuclear);
					petroleum_counts[count] = (row.petroleum);
					renewable_counts[count] = (row.renewable);
					total=row.coal+row.natural_gas+row.nuclear+row.petroleum+row.renewable;
					stringHold=stringHold+"<tr>"+"<td>"+row.year+"</td>" +"<td>"+row.coal+"</td>"+"<td>"+row.natural_gas+"</td>"+"<td>"+row.nuclear+"</td>"+"<td>"+row.petroleum+"</td>"+"<td>"+row.renewable+"</td>"+"<td>"+total+"</td>"+"</tr>";
					count = count + 1;
				})
				resolve(stringHold);
			});
		})
			replacePromise.then(data=>{
				for(var i = 0 ; i<stateArr.length;i++)
			{
				if(stateArr[i]===state)
				{
					if(stateArr[i]==="WY")
					{
						stateAfter = req.url.substring(0,7)+"AK";
						stateBefore = req.url.substring(0,7)+stateArr[i-1];

					}
					if(stateArr[i] === "AK")
					{
						stateBefore= req.url.substring(0,7)+"WY";
						stateAfter = req.url.substring(0,7)+stateArr[i+1];
					}
					else
					{
						stateAfter = req.url.substring(0,7)+stateArr[i+1];
						stateBefore = req.url.substring(0,7)+stateArr[i-1];
					}
				}
			}
				response = response.replace('<a class="prev_next" href="prev">XX</a>','<a class="prev_next" href="'+stateBefore+'">'+stateBefore.substring(7)+'</a>');
				response=response.replace("replace",data);
				response=response.replace("Yearly Snapshot", "Yearly Snapshot of "+ stateName);
				response= response.replace("In Depth Analysis", "In Depth Analysis of "+stateName);
				image = "/images/"+state+".jpg";
				response= response.replace("/images/noimage.jpg",image);
        response=response.replace("No Image","Map of " + "\"" + stateName +"\"");
				response= response.replace("var state;", "var state = " + "\"" + stateName + "\""+ ";");
        response=response.replace("var coal_counts;","var coal_counts = [" + coal_counts + "];");
        response=response.replace("var natural_gas_counts;","var natural_gas_counts = [" + natural_counts + "];");
        response=response.replace("var nuclear_counts;","var nuclear_counts = [" + nuclear_counts + "];");
        response=response.replace("var petroleum_counts;","var petroleum_counts = [" + petroleum_counts + "];");
        response=response.replace("var renewable_counts;","var renewable_counts = [" + renewable_counts + "];");
			WriteHtml(res, response);

			});

        // modify `response` here
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        let energy = req.url.substring(13);
        let stringHold = ""; 
        var data = {};
        var variables = {};
        totals = new Array (58).fill(0);
	   
  		var replacePromise = new Promise((resolve,reject)=> {
        
  			db.all('SELECT * FROM Consumption ORDER BY year,state_abbreviation',(err,rows)=>{
          var count = 0;
  				rows.forEach(function (row) {
  					//check if the year already exists (hasOwnProperty(key))
  					if(data.hasOwnProperty(row.year)!= true)
  					{
  						data[row.year] = new Object ();
  					}
            if(variables.hasOwnProperty(row.state_abbreviation) != true)
            {
              variables[row.state_abbreviation] = new Array (58).fill(0);
            }
  					data[row.year][row.state_abbreviation] = row[energy];
            variables[row.state_abbreviation][count] = row[energy];
            count = count +1;  
            if (count == 58)
            {
              count = 0;
            }

  				})

          console.log(variables);

  				let k =0; 
  				for(let i =1960; i < 2018; i ++)
  				{
  					stringHold = stringHold + "<tr>" + "<td> " + i + "</td>";

  					Object.values(data[i]).forEach((value) =>{
						stringHold = stringHold + "<td>" + value + "</td>";
						totals[k] = totals[k] + value;
  					})
  						 	
  					stringHold = stringHold + "<td>" + totals[k] + "</td>" + "</tr>";
  					k = k + 1;
  				}

				resolve(stringHold);
  				
  			});
  			
  		})
          replacePromise.then(data=>{
            response = response.replace("replace",data);
            if(energy == "natural_gas")
            { //just to get rid of the underscore 
              response = response.replace("In Depth Analysis", "In Depth Analysis of natural gas");
              response = response.replace("Consumption Snapshot","Consumption Snapshot of natural gas");
              response = response.replace("<h1>US Energy Consumption!</h1>", "<h1>US Energy Consumption of natural gas</h1>" );
              response = response.replace("var energy_type;", "var energy_type = \"natural gas\";"); 
            }
            else{
              response = response.replace("In Depth Analysis", "In Depth Analysis of " + energy);
              response = response.replace("Consumption Snapshot", "Consumption Snapshot of "+energy);
              response = response.replace("<h1>US Energy Consumption!</h1>", "<h1>US Energy Consumption of " + energy + "</h1>" );
              response = response.replace("var energy_type;", "var energy_type = " + "\"" + energy + "\"" +";"); 
            }
            
            response=response.replace("No Image","Visual of " + "\"" + energy + "\"");
            repsonse=response.replace("var energy_counts;","var energy_counts = " + JSON.stringify(variables) + ";");
            response=response.replace("images/noimage.jpg", "images/"+energy+".jpg");
            WriteHtml(res,response);
          });
    }).catch((err) => {
        Write404Error(res);
    });
});

function ReadFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString());
            }
        });
    });
}

function Write404Error(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: file not found');
    res.end();
}

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}


var server = app.listen(port);