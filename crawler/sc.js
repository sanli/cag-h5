var page = require('webpage').create();
  page.viewportSize = { width: 1024, height: 800 };
page.open('http://localhost:8080/img/545e25abc961b273669d6906', function() {
  page.render('github.png');
  phantom.exit();
});
