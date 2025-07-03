// src/scripts/utils/url-parser.js
const UrlParser = {
  parseActiveUrlWithCombiner() {
    const url = window.location.hash.slice(1); // ❌ HAPUS .toLowerCase() 
    const splitedUrl = this._urlSplitter(url);
    return this._urlCombiner(splitedUrl);
  },

  parseActiveUrlWithoutCombiner() {
    const url = window.location.hash.slice(1); // ❌ HAPUS .toLowerCase()
    return this._urlSplitter(url);
  },

  _urlSplitter(url) {
    const urlsSplits = url.split('/');
    
    return {
      resource: urlsSplits[1] ? urlsSplits[1].toLowerCase() : null, // ✅ Hanya resource yang lowercase
      id: urlsSplits[2] || null, // ✅ ID tetap case-sensitive
      verb: urlsSplits[3] ? urlsSplits[3].toLowerCase() : null, // ✅ Verb bisa lowercase
    };
  },

  _urlCombiner(splitedUrl) {
    if (splitedUrl.resource === null) {
      return '/';
    }

    if (splitedUrl.id === null) {
      return `/${splitedUrl.resource}`;
    }

    if (splitedUrl.verb === null) {
      return `/${splitedUrl.resource}/:id`;
    }

    return `/${splitedUrl.resource}/:id/${splitedUrl.verb}`;
  },
};

export default UrlParser;