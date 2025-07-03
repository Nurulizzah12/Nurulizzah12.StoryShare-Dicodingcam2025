class StoryModel {
  constructor(id, name, description, photoUrl, createdAt, lat = null, lon = null) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.photoUrl = photoUrl;
    this.createdAt = createdAt;
    this.lat = lat;
    this.lon = lon;
  }
}

export default StoryModel;