const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();

app.use('/css', express.static(__dirname + '/css'));
app.use(bodyParser.urlencoded({ extended: true }));

// Your OpenWeatherMap API key
const apiKey = "818c0443dd786ad1d5d9a5503957a41c";

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.post("/", async function (req, res) {
  const query = req.body.cityName;
  const unit = "metric";
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=${unit}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${apiKey}&units=${unit}`;

  try {
    const [currentWeatherData, forecastData] = await Promise.all([
      getWeatherData(currentWeatherUrl),
      getWeatherData(forecastUrl)
    ]);

    // Extract relevant weather data
    const temp = currentWeatherData.main.temp;
    const weatherDescription = currentWeatherData.weather[0].description;
    const icon = currentWeatherData.weather[0].icon;
    const weatherClass = currentWeatherData.weather[0].main;
    const imageURL = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const precipitation = currentWeatherData.clouds.all;
    const clouds = currentWeatherData.clouds.all;
    const pressure = currentWeatherData.main.pressure;
    const windSpeed = currentWeatherData.wind.speed;

    // Create a new HTML page to display weather information
    let weatherPage = "<link rel='stylesheet' href='css/styles.css'>";
    weatherPage += "<div class='top-left'>" + getFormattedDateTime() + "</div>";
    weatherPage += "<div class='search-bar'><form action='/' method='post'><input type='text' name='cityName' placeholder='Enter city' /><button type='submit'>Search</button></form></div>";
    weatherPage += "<h1>Weather Information</h1>";
    weatherPage += "<div class='weather-alert'>" + getWeatherAlert(weatherClass) + "</div>";
    weatherPage += "<div class='weather-info " + weatherClass + "'>";
    weatherPage += `<h2>The temperature in ${query} is ${temp} °C.</h2>`;
    weatherPage += "<p>The weather is currently " + weatherDescription + " in " + query + ".</p>";
    weatherPage += "<img src=" + imageURL + ">";
    weatherPage += "<h3>5-Day Forecast:</h3>";
    weatherPage += "<table class='table'>";
    weatherPage += "<tr><th>Date</th><th>Weekday</th><th>Temperature</th><th>Description</th></tr>";

    // Process forecast data
    const forecastList = forecastData.list;
    const dailyForecast = {}; // To store one forecast per day

    forecastList.forEach((forecast) => {
      const forecastDate = new Date(forecast.dt * 1000);
      const forecastWeekday = forecastDate.toLocaleDateString("en-US", { weekday: "short" });
      const forecastDateString = forecastDate.toLocaleDateString();
      
      // If forecastDate is not in dailyForecast, add it to the table
      if (!dailyForecast[forecastDateString]) {
        const forecastTemp = forecast.main.temp;
        const forecastDescription = forecast.weather[0].description;
        weatherPage += `<tr><td>${forecastDateString}</td><td>${forecastWeekday}</td><td>${forecastTemp} °C</td><td>${forecastDescription}</td></tr>`;
        dailyForecast[forecastDateString] = true;
      }
    });
    weatherPage += "</table>";
    weatherPage += "</div>";

    // Display additional weather data table
    weatherPage += "<h3>Additional Weather Data:</h3>";
    weatherPage += "<table class='additional-data-table'>";
    weatherPage += "<tr><th>Parameter</th><th>Value</th></tr>";
    weatherPage += `<tr><td><strong>Precipitation</strong></td><td>${precipitation}%</td></tr>`;
    weatherPage += `<tr><td><strong>Clouds</strong></td><td>${clouds}%</td></tr>`;
    weatherPage += `<tr><td><strong>Pressure</strong></td><td>${pressure} hPa</td></tr>`;
    weatherPage += `<tr><td><strong>Wind Speed</strong></td><td>${windSpeed} m/s</td></tr>`;
    weatherPage += "</table>";

    weatherPage += "</body>";

    // Send the new page as a response
    res.send(weatherPage);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    res.status(500).send("Error fetching weather data.");
  }
});

async function getWeatherData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, function (response) {
      let data = "";

      response.on("data", function (chunk) {
        data += chunk;
      });

      response.on("end", function () {
        const weatherData = JSON.parse(data);
        resolve(weatherData);
      });

      response.on("error", function (error) {
        reject(error);
      });
    });
  });
}

function getFormattedDateTime() {
  const now = new Date();
  const options = { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
  return now.toLocaleDateString("en-US", options);
}

function getWeatherAlert(weatherClass) {
  if (weatherClass === "Rain") {
    return "Carry an umbrella!";
  } else if (weatherClass === "Snow") {
    return "Bundle up for the snow!";
  } else if (weatherClass === "Clear") {
    return "It's sunny outside, how about a beer?";
  } else if (weatherClass === "mist" ){
    return "Avoid outdoor activities.";
  } else {
    return "Enjoy the weather!";
  }
}





const PORT = 3001;

app.listen(PORT, function () {
  console.log(`Server started at port ${PORT}.`);
});
