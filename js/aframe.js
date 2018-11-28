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


    el.setAttribute("geometry", "buffer", false);
   // el.setAttribute("material", "src", this.constructURL(this.data));
    el.removeAttribute("material", "color");

    var texture = this.getTexture(this.data);

    this.createTerrain(this.data, texture);

    /*el.setAttribute("material", "src", url);
    el.removeAttribute("material", "color");*/

  },
  getCities: function(bbox){
    var extent = ol.proj.transformExtent(bbox, 'EPSG:3857', 'EPSG:4326');
    console.log("EXTENT", extent);

  },
  createTerrain: function(data, texture) {

    var heightData = data;

    heightData.url = 'https://geoservices.informatievlaanderen.be/raadpleegdiensten/DHMV/wms';
    heightData.layers = 'DHMVII_DSM_1m';

    var heightUrl = this.constructURL(heightData);

    var scale = 200;

    var _this = this;

    var canvas = document.createElement( 'canvas' );
    canvas.width = data.width;
    canvas.height = data.height;
    var size = data.width * data.height;
    var data = new Float32Array( size );
    var context = canvas.getContext( '2d' );
    var img = new Image;
    img.crossOrigin = "Anonymous";
    img.onload = function(){
      context.drawImage(img,0,0);

      for ( var i = 0; i < size; i ++ ) {
        data[i] = 0;
      }

      var imgd = context.getImageData(0, 0, img.width, img.height);
      var pix = imgd.data;

      var j=0;
      for (var i = 0; i<pix.length; i +=8) {
        var all = pix[i]+pix[i+1]+pix[i+2];
        data[j++] = all/(12*scale);
      }

    _this.createMesh(img.width / 2, img.height / 2, data, texture);

    };
    img.src = heightUrl;

    /*return $.ajax(
      {
        type: "GET",
        url: heightUrl,
        data: JSON.stringify(data)
      }
    )*/
  },
  getTexture: function(data) {
    var textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "Anonymous";
    return textureLoader.load(this.constructURL(data))
  },
  createMesh: function(width, height, data, texture) {
    var geom = this.el.getAttribute('geometry');
    var geometry = new THREE.PlaneGeometry(geom.width, geom.height, width -1, height -1 );
    var material = new THREE.MeshLambertMaterial( { map: texture } );

    //set height of vertices
    for ( var i = 0; i< geometry.vertices.length; i++ ) {
      geometry.vertices[i].z = data[i];
    }

    this.el.getObject3D('mesh').geometry = geometry;
    this.el.getObject3D('mesh').material = material;
   // this.el.setAttribute("geometry", geometry);
   // this.el.setAttribute("material", material);
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
