// API KEY

const apiKey = "49ddd3b2c7fb90eb3d5741bf4ba0c975";
document.title = "SkyCast | Live Weather";

const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const themeBtn = document.getElementById("themeBtn");
const voiceBtn = document.getElementById("voiceBtn");
const weatherResult = document.getElementById("weatherResult");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const favoriteBtn=document.getElementById("favoriteBtn");
const toast=document.getElementById("toast");
const scrollTopBtn=document.getElementById("scrollTopBtn");

let currentUnit = "metric";
let currentCity = "";

searchBtn.addEventListener("click", () => {
    getWeather(cityInput.value.trim());
});

cityInput.addEventListener("keypress", function(event){
    if(event.key==="Enter"){
        getWeather(cityInput.value.trim());
    }
});

locationBtn.addEventListener("click", getCurrentLocation);
favoriteBtn.addEventListener("click",toggleFavorite);

async function getWeather(city){

    if(city===""){
        showError("Please enter a city.");
        return;
    }
    currentCity = city;
    showLoading();

    try{
        const url=
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${currentUnit}`;
        const response=await fetch(url);
        const data=await response.json();
        if(data.cod!=200){
            throw new Error(data.message);
        }

        hideLoading();
        displayWeather(data);
        getForecast(city);
        getAQI(data.coord.lat,data.coord.lon);
        saveRecentSearch(city);
    }
    catch(err){
        hideLoading();
        showError(err.message);
    }

}

function getCurrentLocation(){
    if(!navigator.geolocation){
        showError("Geolocation is not supported.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async(position)=>{
            showLoading();
            const lat=position.coords.latitude;
            const lon=position.coords.longitude;
            try{

                const url=
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}`;

                const response=await fetch(url);
                const data=await response.json();
                hideLoading();

                cityInput.value=data.name;
                currentCity=data.name;

                displayWeather(data);
                getForecast(data.name);
                getAQI(lat,lon);
                saveRecentSearch(data.name);
            }

            catch{
                hideLoading();
                showError("Unable to get location.");
            }
        },
        ()=>{
            showError("Location permission denied.");
        }
    );
}

function showLoading(){
    loading.style.display="block";
    weatherResult.style.display="none";
    error.innerHTML="";
}

function hideLoading(){
    loading.style.display="none";
    weatherResult.style.display="block";
}

function showError(message){
    weatherResult.style.display="none";
    loading.style.display="none";
    error.innerHTML="❌ "+message;
}

function updateClock(){
    const now=new Date();
    document.getElementById("currentDate").innerHTML=
    now.toLocaleDateString(undefined,{
        weekday:"long",
        month:"long",
        day:"numeric",
        year:"numeric"
    });
    document.getElementById("currentTime").innerHTML=
    now.toLocaleTimeString();
}

updateClock();
setInterval(updateClock,60000);

function displayWeather(data){

    weatherResult.style.display="block";

    document.getElementById("cityName").innerHTML=`${data.name}, ${data.sys.country}`;

    document.title=`${data.name} | SkyCast `;

    document.getElementById("temperature").innerHTML=`${Math.round(data.main.temp)}°`;

    document.getElementById("condition").innerHTML=data.weather[0].description;

    document.getElementById("feelsLike").innerHTML=`${Math.round(data.main.feels_like)}°`;

    document.getElementById("humidity").innerHTML=`${data.main.humidity}%`;

    document.getElementById("pressure").innerHTML=`${data.main.pressure} hPa`;

    document.getElementById("visibility").innerHTML=`${data.visibility/1000} km`;

    document.getElementById("wind").innerHTML=`${data.wind.speed} m/s`;

    document.getElementById("direction").innerHTML=getDirection(data.wind.deg);

    document.getElementById("sunrise").innerHTML=convertTime(data.sys.sunrise);

    document.getElementById("sunset").innerHTML=convertTime(data.sys.sunset);

    document.getElementById("weatherIcon").src=`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    document.getElementById("lastUpdated").innerHTML=
    "Updated: "+
    new Date().toLocaleTimeString([],{
        hour:"2-digit",
        minute:"2-digit"
    });
    updateFavoriteIcon();
}

function getDirection(deg){

    const directions=[
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW"
    ];

    return directions[
        Math.round(deg/45)%8
    ];

}

function convertTime(unix){
    const date=new Date(unix*1000);
    return date.toLocaleTimeString([],{
        hour:"2-digit",
        minute:"2-digit"
    });
}

async function getForecast(city){
    const url=`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${currentUnit}`;
    const response=await fetch(url);
    const data=await response.json();
    showForecast(data);
    showHourly(data);
}

function showForecast(data){
    const container=document.getElementById("forecastContainer");

    container.innerHTML="";
    const daily=[];
    data.list.forEach(item=>{
        if(item.dt_txt.includes("12:00:00")){
            daily.push(item);
        }
    });

    daily.slice(0,5).forEach(day=>{
        container.innerHTML+=`
        <div class="forecast-card fade-up">
            <h3>
                ${new Date(day.dt_txt)
                .toLocaleDateString("en-US",{
                weekday:"short"
                })}
            </h3>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png">
            <p>${Math.round(day.main.temp)}°</p>
            <p>${day.weather[0].main}</p>
        </div>
        `;
    });
}

function showHourly(data){
    const container=document.getElementById("hourlyContainer");

    container.innerHTML="";
    data.list.slice(0,8).forEach(hour=>{
        container.innerHTML+=`
        <div class="hour-card">
            <h3>
            ${new Date(hour.dt_txt)
            .toLocaleTimeString([],{
            hour:"2-digit",
            minute:"2-digit"
            })}
            </h3>
            <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png">
            <p>${Math.round(hour.main.temp)}°</p>
        </div>
        `;
    });
}

async function getAQI(lat,lon){

    const url=`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const response=await fetch(url);
    const data=await response.json();
    const aqi=data.list[0].main.aqi;
    const levels=[
        "",
        "Good",
        "Fair",
        "Moderate",
        "Poor",
        "Very Poor"
    ];
    const colors=[
        "",
        "#4CAF50",
        "#CDDC39",
        "#FFC107",
        "#FF5722",
        "#F44336"
    ];
    document.getElementById("aqiCard").innerHTML=`
        <div class="aqi-circle"
        style="border-color:${colors[aqi]}">
            <span>${aqi}</span>
        </div>
        <h3 style="color:${colors[aqi]}">
            ${levels[aqi]}
        </h3>
    `;
}

function saveRecentSearch(city){
    let history=JSON.parse(
    localStorage.getItem("history")
    )||[];

    history=history.filter(item=>item!==city);
    history.unshift(city);
    history=history.slice(0,5);

    localStorage.setItem(
        "history",
        JSON.stringify(history)
    );
    loadHistory();
}

function loadHistory(){
    const list=document.getElementById("historyList");

    list.innerHTML="";
    const history=JSON.parse(
    localStorage.getItem("history")
    )||[];

    history.forEach(city=>{
        list.innerHTML+=`
        <li onclick="historySearch('${city}')">
            ${city}
        </li>
        `;
    });
}

function historySearch(city){
    cityInput.value=city;
    getWeather(city);
}

document.getElementById("clearHistory")

.addEventListener("click",()=>{
    localStorage.removeItem("history");
    loadHistory();
});

loadHistory();

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const icon = themeBtn.querySelector("i");
    if(document.body.classList.contains("dark")){
        icon.className = "fa-solid fa-sun";
        localStorage.setItem("theme","dark");
    }
    else{
        icon.className = "fa-solid fa-moon";
        localStorage.setItem("theme","light");
    }
});

function loadTheme(){
    const theme = localStorage.getItem("theme");
    if(theme==="dark"){
        document.body.classList.add("dark");
        themeBtn.querySelector("i").className="fa-solid fa-sun";
    }

}

loadTheme();

const celsiusBtn=document.getElementById("celsiusBtn");
const fahrenheitBtn=document.getElementById("fahrenheitBtn");

celsiusBtn.addEventListener("click",()=>{
    currentUnit="metric";
    if(currentCity!="")
        getWeather(currentCity);
});

fahrenheitBtn.addEventListener("click",()=>{
    currentUnit="imperial";
    if(currentCity!="")
        getWeather(currentCity);
});

const favoriteList=document.getElementById("favoriteList");

function saveFavorite(city){
    let favorites=
    JSON.parse(localStorage.getItem("favorites")) || [];
    if(!favorites.includes(city)){
        favorites.push(city);
    }
    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );

    loadFavorites();

}

function loadFavorites(){
    favoriteList.innerHTML="";
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if(favorites.length===0){
        favoriteList.innerHTML=`
            <li style="justify-content:center; cursor:default;">
                No favorite cities yet ❤️
            </li>
        `;
        return;
    }

    favorites.forEach(city=>{
        favoriteList.innerHTML += `
        <li>
            <span
                class="favorite-city"
                onclick="historySearch('${city}')">
                📍 ${city}
            </span>
            <i
                class="fa-solid fa-trash"
                onclick="removeFavorite('${city}')"
                title="Remove">
            </i>
        </li>
        `;
    });
}

function removeFavorite(city){
    let favorites=JSON.parse(localStorage.getItem("favorites")) || [];

    favorites=favorites.filter(item=>item!==city);
    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );

    loadFavorites();
    updateFavoriteIcon();
}

function toggleFavorite(){
    if(currentCity==="") return;
    let favorites=JSON.parse(
        localStorage.getItem("favorites")
    ) || [];

    if(favorites.includes(currentCity)){
        favorites=favorites.filter(
            city=>city!==currentCity
        );
    }
    else{
        favorites.push(currentCity);
    }

    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );

    loadFavorites();
    updateFavoriteIcon();

    if(favorites.includes(currentCity)){
        showToast("❤️ Added to Favorites");
    }
    else{
        showToast("🗑 Removed from Favorites");
    }
}

function updateFavoriteIcon(){
    let favorites=JSON.parse(
        localStorage.getItem("favorites")
    ) || [];

    const icon=favoriteBtn.querySelector("i");
    if(favorites.includes(currentCity)){
        favoriteBtn.classList.add("active");
        icon.className="fa-solid fa-heart";
    }
    else{
        favoriteBtn.classList.remove("active");
        icon.className="fa-regular fa-heart";
    }
}

function showToast(message){

    toast.innerHTML=message;
    toast.classList.add("show");
    setTimeout(()=>{
        toast.classList.remove("show");
    },2500);
}

document.getElementById("cityName")

.addEventListener("dblclick",()=>{
    if(currentCity!=""){
        saveFavorite(currentCity);
        alert("Added to Favorites ❤️");
    }
});

loadFavorites();

voiceBtn.addEventListener("click",()=>{

    if(!('webkitSpeechRecognition' in window)){
        alert("Voice Search Not Supported");
        return;
    }

    const recognition=
    new webkitSpeechRecognition();
    recognition.lang="en-US";
    recognition.start();
    recognition.onresult=function(event){
        const city=
        event.results[0][0].transcript;
        cityInput.value=city;
        getWeather(city);
    }
});

window.addEventListener("load",()=>{
    const history=
    JSON.parse(localStorage.getItem("history")) || [];
    if(history.length>0){
        cityInput.value=history[0];
        getWeather(history[0]);
    }
});

function clearAnimation(){
    document.getElementById("weatherAnimation").innerHTML="";
}

function weatherAnimation(type){
    changeWeatherBackground(type);
    clearAnimation();
    const area=document.getElementById("weatherAnimation");
    switch(type.toLowerCase()){
        case "rain":
        case "drizzle":
            for(let i=0;i<30;i++){
                const drop=document.createElement("div");
                drop.className="raindrop";
                drop.style.left=Math.random()*100+"vw";
                drop.style.animationDuration=
                .6+Math.random()+"s";
                drop.style.animationDelay=
                Math.random()+"s";
                area.appendChild(drop);
            }
            break;
        case "snow":
            for(let i=0;i<20;i++){
                const snow=document.createElement("div");
                snow.className="snowflake";
                snow.innerHTML="❄";
                snow.style.left=Math.random()*100+"vw";
                snow.style.animationDuration=
                4+Math.random()*4+"s";
                snow.style.animationDelay=
                Math.random()*5+"s";
                area.appendChild(snow);
            }
            break;
        case "clouds":
            for(let i=0;i<5;i++){
                const cloud=document.createElement("div");
                cloud.className="cloud";
                cloud.style.top=
                60+i*90+"px";
                cloud.style.animationDuration=
                20+i*5+"s";
                area.appendChild(cloud);
            }
            break;
        case "clear":
            const sun=document.createElement("div");
            sun.className="sun";
            area.appendChild(sun);
            break;
        case "thunderstorm":
            const flash=document.createElement("div");
            flash.className="flash";
            area.appendChild(flash);
            break;
        case "mist":
        case "fog":
        case "haze":
            for(let i=0;i<6;i++){
                const fog=document.createElement("div");
                fog.className="fog";
                fog.style.top=i*90+"px";
                area.appendChild(fog);
            }
            break;
    }
}

function changeWeatherBackground(type){
    const body = document.body;

    switch(type.toLowerCase()){
        case "clear":
            body.style.background =
            "linear-gradient(135deg,#f6d365,#fda085)";
            break;
        case "clouds":
            body.style.background =
            "linear-gradient(135deg,#bdc3c7,#2c3e50)";
            break;
        case "rain":
        case "drizzle":
            body.style.background =
            "linear-gradient(135deg,#4b79a1,#283e51)";
            break;
        case "snow":
            body.style.background =
            "linear-gradient(135deg,#e6dada,#274046)";
            break;
        case "thunderstorm":
            body.style.background =
            "linear-gradient(135deg,#232526,#414345)";
            break;
        case "mist":
        case "fog":
        case "haze":
            body.style.background =
            "linear-gradient(135deg,#757f9a,#d7dde8)";
            break;
        default:
            body.style.background =
            "linear-gradient(135deg,#4facfe,#00f2fe)";
    }
}

const oldDisplayWeather=displayWeather;

displayWeather=function(data){
    oldDisplayWeather(data);
    weatherAnimation(data.weather[0].main);
};

window.addEventListener("scroll",()=>{
    if(window.scrollY>300){
        scrollTopBtn.style.display="block";
    }
    else{
        scrollTopBtn.style.display="none";
    }
});

scrollTopBtn.addEventListener("click",()=>{
    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
});

document.getElementById('year').innerText = new Date().getFullYear();
