
$(document).ready(function(){
    var $body = $('body');
    var $dragDropArea =  $("#drag-drop-area");
    var $uploadBtn =  $("#upload-btn");
    var $files =  $("#files");
    var $loading =  $("#parser-loading");
    var $modal =  $("#modal");
    var $modalCloseBtn =  $("#modal-close-btn");
    var $docxjsWrapper =$("#docxjs-wrapper");

    var instance = null;

    var stopEvent= function(e) {
        if(e.preventDefault) e.preventDefault();
        if(e.stopPropagation) e.stopPropagation();

        e.returnValue = false;
        e.cancelBubble = true;
        e.stopped = true;
    };

    var getInstanceOfFileType = function(file) {
        var fileExtension = null;

        if (file) {
            var fileName = file.name;
            fileExtension = fileName.split('.').pop();
        }

        return fileExtension;
    };

    var documentParser = function(file) {
        var fileType = getInstanceOfFileType(file);

        if (fileType) {
            if (fileType == 'docx') {
                instance = window.docxJS = window.createDocxJS ? window.createDocxJS() : new window.DocxJS();

            } else if (fileType == 'xlsx') {
                instance = window.cellJS = window.createCellJS ? window.createCellJS() : new window.CellJS();

            } else if (fileType == 'pptx') {
                instance = window.slideJS = window.createSlideJS ? window.createSlideJS() : new window.SlideJS();

            } else if (fileType == 'pdf') {
                instance = window.pdfJS = window.createPdfJS ? window.createPdfJS() : new window.PdfJS();
                instance.setCMapUrl('./cmaps/');
            }


            if (instance) {
                $loading.show();
                instance.parse(
                    file,
                    function () {
                        $docxjsWrapper[0].filename = files.name;
                        afterRender(file, fileType);
                        $loading.hide();
                    }, function (e) {
                        if(!$body.hasClass('is-docxjs-rendered')){
                            $docxjsWrapper.hide();
                        }

                        if(e.isError && e.msg){
                            alert(e.msg);
                        }

                        $loading.hide();
                    }, null
                );
            }
        }
    };

    var afterRender = function (file, fileType) {
        var element = $docxjsWrapper[0];
        $(element).css('height','calc(100% - 65px)');

        var loadingNode = document.createElement("div");
        loadingNode.setAttribute("class", 'docx-loading');
        element.parentNode.insertBefore(loadingNode, element);
        $modal.show();

        var endCallBackFn = function(result){
            if (result.isError) {
                if(!$body.hasClass('is-docxjs-rendered')){
                    $docxjsWrapper.hide();
                    $body.removeClass('is-docxjs-rendered');
                    element.innerHTML = "";

                    $modal.hide();
                    $body.addClass('rendered');
                }
            } else {
                $body.addClass('is-docxjs-rendered');
                console.log("Success Render");
            }

            loadingNode.parentNode.removeChild(loadingNode);
        };

        if (fileType === 'docx') {
            window.docxAfterRender(element, endCallBackFn);

        } else if (fileType === 'xlsx') {
            window.cellAfterRender(element, endCallBackFn);

        } else if (fileType === 'pptx') {
            window.slideAfterRender(element, endCallBackFn, 0);

        } else if (fileType === 'pdf') {
            window.pdfAfterRender(element, endCallBackFn, 0);
        }
    };

    $uploadBtn.on("click", function(e){
        stopEvent(e);
        $files.val('');
        $files.trigger("click");
    });

    $dragDropArea.on("click", function(e){
        stopEvent(e);
        $files.val('');
        $files.trigger("click");
    }).on("dragover", function(e) {
        stopEvent(e);
        $dragDropArea.addClass("drag-on");
    }).on("dragenter", function(e) {
        stopEvent(e);
    }).on("dragleave", function(e) {
        stopEvent(e);
        $dragDropArea.removeClass("drag-on");
    }).on("drop", function(e){
        stopEvent(e);
        $dragDropArea.removeClass("drag-on");
        if(e.originalEvent.dataTransfer){
            if(e.originalEvent.dataTransfer.files.length) {
                var files = e.originalEvent.dataTransfer.files;
                documentParser(files[0]);
            }
        }
    });

    $files.on('change', function(e){
        stopEvent(e);

        var file = e.target.files[0];
        documentParser(file);
    });

    $modalCloseBtn.on("click", function(e){
        $docxjsWrapper.empty();
        $modal.hide();

        instance.destroy(function(){
            instance = null;
        });
    });
});
