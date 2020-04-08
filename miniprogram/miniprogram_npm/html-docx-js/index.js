module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1585642872441, function(require, module, exports) {
var JSZip, fs, internal;

JSZip = require('jszip');

internal = require('./internal');

fs = require('fs');

module.exports = {
  asBlob: function(html, options) {
    var zip;
    zip = new JSZip();
    internal.addFiles(zip, html, options);
    return internal.generateDocument(zip);
  }
};

}, function(modId) {var map = {"./internal":1585642872442}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1585642872442, function(require, module, exports) {
var _, documentTemplate, fs, utils;

fs = require('fs');

documentTemplate = require('./templates/document');

utils = require('./utils');

_ = {
  merge: require('lodash.merge')
};

module.exports = {
  generateDocument: function(zip) {
    var buffer;
    buffer = zip.generate({
      type: 'arraybuffer'
    });
    if (global.Blob) {
      return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
    } else if (global.Buffer) {
      return new Buffer(new Uint8Array(buffer));
    } else {
      throw new Error("Neither Blob nor Buffer are accessible in this environment. " + "Consider adding Blob.js shim");
    }
  },
  renderDocumentFile: function(documentOptions) {
    var templateData;
    if (documentOptions == null) {
      documentOptions = {};
    }
    templateData = _.merge({
      margins: {
        top: 1440,
        right: 1440,
        bottom: 1440,
        left: 1440,
        header: 720,
        footer: 720,
        gutter: 0
      }
    }, (function() {
      switch (documentOptions.orientation) {
        case 'landscape':
          return {
            height: 12240,
            width: 15840,
            orient: 'landscape'
          };
        default:
          return {
            width: 12240,
            height: 15840,
            orient: 'portrait'
          };
      }
    })(), {
      margins: documentOptions.margins
    });
    return documentTemplate(templateData);
  },
  addFiles: function(zip, htmlSource, documentOptions) {
    zip.file('[Content_Types].xml', fs.readFileSync(__dirname + '/assets/content_types.xml'));
    zip.folder('_rels').file('.rels', fs.readFileSync(__dirname + '/assets/rels.xml'));
    return zip.folder('word').file('document.xml', this.renderDocumentFile(documentOptions)).file('afchunk.mht', utils.getMHTdocument(htmlSource)).folder('_rels').file('document.xml.rels', fs.readFileSync(__dirname + '/assets/document.xml.rels'));
  }
};

}, function(modId) { var map = {"./utils":1585642872444}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1585642872444, function(require, module, exports) {
var mhtDocumentTemplate, mhtPartTemplate;

mhtDocumentTemplate = require('./templates/mht_document');

mhtPartTemplate = require('./templates/mht_part');

module.exports = {
  getMHTdocument: function(htmlSource) {
    var imageContentParts, ref;
    ref = this._prepareImageParts(htmlSource), htmlSource = ref.htmlSource, imageContentParts = ref.imageContentParts;
    htmlSource = htmlSource.replace(/\=/g, '=3D');
    return mhtDocumentTemplate({
      htmlSource: htmlSource,
      contentParts: imageContentParts.join('\n')
    });
  },
  _prepareImageParts: function(htmlSource) {
    var imageContentParts, inlinedReplacer, inlinedSrcPattern;
    imageContentParts = [];
    inlinedSrcPattern = /"data:(\w+\/\w+);(\w+),(\S+)"/g;
    inlinedReplacer = function(match, contentType, contentEncoding, encodedContent) {
      var contentLocation, extension, index;
      index = imageContentParts.length;
      extension = contentType.split('/')[1];
      contentLocation = "file:///C:/fake/image" + index + "." + extension;
      imageContentParts.push(mhtPartTemplate({
        contentType: contentType,
        contentEncoding: contentEncoding,
        contentLocation: contentLocation,
        encodedContent: encodedContent
      }));
      return "\"" + contentLocation + "\"";
    };
    if (typeof htmlSource === 'string') {
      if (!/<img/g.test(htmlSource)) {
        return {
          htmlSource: htmlSource,
          imageContentParts: imageContentParts
        };
      }
      htmlSource = htmlSource.replace(inlinedSrcPattern, inlinedReplacer);
      return {
        htmlSource: htmlSource,
        imageContentParts: imageContentParts
      };
    } else {
      throw new Error("Not a valid source provided!");
    }
  }
};

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1585642872441);
})()
//# sourceMappingURL=index.js.map