import lib from 'query-string';

const PARAM_SEPARATOR = ';';

function toLowerCaseFirstLetter(word) {
  return word[0].toLowerCase() + word.slice(1);
}
const getFilters = (location = {}) => {
  const {
    search
  } = location;

  const searchParameters = lib.parse(search);
  const filters = {};

  Object.entries(searchParameters).forEach(([key, value]) => {
    filters[toLowerCaseFirstLetter(key)] = value;
  });

  return filters;
}

const parseParam = (paramStr) => {
  if (paramStr && typeof paramStr === 'string') {
    return paramStr.split(PARAM_SEPARATOR);
  }
}


const queryString = {
  getQueryFilters: getFilters
};

const paramString = {
  parseParam: parseParam
};

export {
  queryString,
  paramString
}
