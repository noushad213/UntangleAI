class Office {
  constructor({ id, name, type, address, city, state, pincode, coordinates, timings, navigationUrl }) {
    this.id = id || Buffer.from(name || Date.now().toString()).toString("base64").substring(0, 10);
    this.name = name;
    this.type = type || "Civic Administrative Office";
    this.address = address;
    this.city = city;
    this.state = state;
    this.pincode = pincode || "N/A";
    this.coordinates = coordinates || { lat: null, lng: null };
    this.timings = timings || "10:00 AM - 05:00 PM (Monday to Saturday)";
    this.navigationUrl = navigationUrl;
  }
}

module.exports = Office;