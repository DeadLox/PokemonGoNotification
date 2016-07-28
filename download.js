const fs = require('fs');
const download = require('download');

for (var i=1; i<=151; i++) {
  var index = i;
  if (index < 10) {
    index = '00'+i;
  } else if (index < 100) {
    index = '0'+i;
  }
  console.log('Download image Pokedex n°'+index);
  download('http://www.serebii.net/pokemongo/pokemon/'+index+'.png', 'images').then(() => {
    console.log('done!');
  });
}
