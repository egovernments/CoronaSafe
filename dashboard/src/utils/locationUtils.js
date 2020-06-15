// Callback function for asynchronous call to HTML5 geolocation
  // Convert Degress to Radians
  function Deg2Rad(deg) {
    return deg * Math.PI / 180;
  }
  
  function PythagorasEquirectangular(lat1, lon1, lat2, lon2) {
    lat1 = Deg2Rad(lat1);
    lat2 = Deg2Rad(lat2);
    lon1 = Deg2Rad(lon1);
    lon2 = Deg2Rad(lon2);
    var R = 6371; // km
    var x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    var y = (lat2 - lat1);
    var d = Math.sqrt(x * x + y * y) * R;
    return d;
  }

  export function findClosest(newLocation, data) {
    let minDif = 99999;
    let closest;
    data.forEach((data) => {
        if(data.location){
            var dif = PythagorasEquirectangular(newLocation.lat, newLocation.lng, data.location.latitude, data.location.longitude);
            if (dif < minDif) {
                closest = data;
                minDif = dif;
            }
        }
    })
    console.log(closest.name + ": " + minDif)
    // echo the nearest city
    return closest;
  }