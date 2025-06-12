var pdfUtil = require('pdf-to-text');
var pdf_path = "C:\\Users\\krish\\WebstormProjects\\internship_applier\\backend_lambda\\resume.pdf";

pdfUtil.info(pdf_path, function(err, info) {
    if (err) throw(err);
    console.log(info);
});