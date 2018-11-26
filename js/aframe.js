AFRAME.registerComponent("wms", {
  schema: {
    url: {
      type:  'string'
    },
    x: {
      type: 'number'
    },
    y: {
      type: 'number'
    },
    projection: {
      type: 'string',
      default: 'EPSG:3857'
    },
    version: {
      type: 'string',
      default: '1.3.0',
      oneOf: ['1.3.0', '1.3', '1.0.0', '1.1.1', '1.1.0', '1.1', '1.0']
    },
    format: {
      type: 'string',
      default: 'png'
    },
    transparent: {
      type: 'string',
      default: 'true'
    },
    layers: {
      type: 'string',
      default: ''
    },
    styles: {
      type: 'string',
      default: ''
    },
    scale: {
      type: 'number'
    },
    time: {
      type: 'string'
    }
  },
  init: function() {
    console.log("HELLO ", this.el);
  },

  update: function(oldData){
    var el = this.el;

    var geom = this.el.getAttribute('geometry');
    var offsetX = 10000;
    var offsetY = offsetX * (geom.height / geom.width);

    this.data.bbox = [this.data.x - offsetX, this.data.y - offsetY, this.data.x + offsetX, this.data.y + offsetY];
    this.data.width = Math.round(geom.width * this.data.scale);
    this.data.height = Math.round(this.data.width * (geom.height / geom.width));


    var texture = this.getTexture(this.data);

    this.createTerrain(texture, this.getHeightData(this.data.bbox));

    el.setAttribute("material", "src", url);
    el.removeAttribute("material", "color");

  },
  getCities: function(bbox){
    var extent = ol.proj.transformExtent(bbox, 'EPSG:3857', 'EPSG:4326');
    console.log("EXTENT", extent);

  },
  getHeightData: function(bbox) {
    var geom = this.el.getAttribute('geometry');
    var extent = ol.proj.transformExtent(bbox, 'EPSG:3857', 'EPSG:4326');
    var deltaX = extent[2] - extent[0];
    var deltaY = extent[3] - extent[1];
    var xPxlStep = (deltaX) / (geom.width);
    var yPxlStep = (deltaY) / (geom.height);

    var locations = [];

    for(var x = 0; x < geom.width; x++) {
      for(var y = 0; y < geom.height; y++) {
        var coordX = extent[0] + (x * xPxlStep);
        var coordY = extent[1] + (y * yPxlStep);

        locations.push({"latitude": coordY, "longitude": coordX});
      }
    }

    var data = { "locations": locations};
    console.log(data);

    $.ajax({type: "POST",
      url: "https://api.open-elevation.com/api/v1/lookup",
      data: JSON.stringify(data),
      contentType: "application/json",
      dataType: 'json'})
      .done(function(data){
      console.log(data);
    });

  },
  getTexture: function(data) {
    var textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "Anonymous";
    return textureLoader.load(this.constructURL(data))
  },
  createTerrain: function(texture, heightdata) {
    var geometry = new THREE.PlaneGeometry(this.el.width, this.el.height, this.el.width / 2, this.el.height / 2);
    var material = new THREE.MeshLambertMaterial( { map: texture } );
    plane = new THREE.Mesh( geometry, material );

    //set height of vertices
    for ( var i = 0; i<plane.geometry.vertices.length; i++ ) {
      plane.geometry.vertices[i].z = data[i];
    }
  },
  constructURL:function(data){


    if(data.version.toLowerCase()=='1.3.0'){
      projParam='CRS'
    }else{
      projParam='SRS'
    }
    var url=data.url+'?'
      +'SERVICE=WMS&'
      +'REQUEST=GetMap&'
      +'BBOX='+ data.bbox+'&'
      +'FORMAT='+'image/'+data.format.toLowerCase()+'&'
      +'HEIGHT='+String(data.height)+'&'
      +'WIDTH='+String(data.width)+'&'
      +'LAYERS='+data.layers+'&'
      +projParam+'='+data.projection.replace(/\s/g,'')+'&' // Replace all white spaces in the projection string
      +'STYLES='+data.styles+'&'
      +'TRANSPARENT='+data.transparent+'&'
      +'VERSION='+data.version + '&'
      +'TIME='+data.time;
    return encodeURI(url);

  }
});
