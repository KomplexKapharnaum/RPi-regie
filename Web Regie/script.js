
$(function() {

  $('.overlay').css('opacity','1').hide();

  ////////////////////////////////////////////////////////////
  /////////////////////////  GENERAL  ////////////////////////
  ////////////////////////////////////////////////////////////

  var editionMode = false;
  var expandedMode = true;
  var fadeTime = 200;

  $('.dispoToggle').click(function(){
    if(expandedMode==true){
      $('.dispoToggle').removeClass('fa-chevron-down').addClass('fa-chevron-up');
      $('#addRemoveDispos').fadeIn(fadeTime);
      $('.dispoMore').slideDown(fadeTime,function(){
        expandedMode=false;
      });
    }
    if(expandedMode==false){
      $('.dispoToggle').removeClass('fa-chevron-up').addClass('fa-chevron-down');
      $('#addRemoveDispos').fadeOut(fadeTime);
      $('.dispoMore').slideUp(fadeTime,function(){
        expandedMode=true;
      });
    }

  });


  $('.editToggle').click(function(){
    if(editionMode==true){
      $('.editToggle').removeClass('btnOn').addClass('btnOff');
      $('body').removeClass('editionMode').addClass('playMode');
      $('.textbtn').removeClass('btn');
      $('.seqControls').fadeOut(fadeTime,function(){
        editionMode=false;
      });
    }
    if(editionMode==false){
      $('.editToggle').removeClass('btnOff').addClass('btnOn');
      $('body').removeClass('playMode').addClass('editionMode');
      $('.textbtn').addClass('btn');
      $('.seqControls').fadeIn(fadeTime,function(){
        editionMode=true;
      });
    }
  });


  ///////// Overlay Closer
  $(".overlay").click(function(e){

    if (e.target !== this){return;}
    else{ $(this).fadeOut(fadeTime); }

  });


  ///////// Add dispo
  $('.addDispo').click(function(){
    pool.addDispo();
  });
  ///////// Add dispo
  $('.removeDispo').click(function(){
    pool.removeDispo();
  });


  $('.stopAll').click(function(){
    socketEmit('STOP', '/all');
  });



  // AUDIO-VIDEO OR LIGHT
  $("input[name='mediaType']").click(function(){
    if($(this).val()=='audiovideo'){
      $('.lightList').hide();
      $('.mediaListDynamic').show();
    }
    if($(this).val()=='light'){
      $('.mediaListDynamic').hide();
      $('.lightList').show();
    }
  });





  ////////////////////////////////////////////////////////////
  /////////////////////////    POOL   ////////////////////////
  ////////////////////////////////////////////////////////////

  pool = new poolObject();
  poolExport = [];
  poolImport = [];

  function poolObject(){

    var that = this;
    that.allDispos = new Array();

    // ADD
    this.addDispo = function(){
      var xIndex = that.allDispos.length-1;
      that.allDispos.push(new dispoObject('name dispo','name operator', xIndex));
      // Expand allMedias Array
      // project.addDispo();
      var xToAdd = that.allDispos.length-1;
      console.log("adding medias with index X: "+xToAdd);
      $.each(project.allScenes,function(index,scene){
        for (var indexY = 0; indexY < 20; indexY++) {
          scene.allMedias.push(new media(xToAdd,indexY,'...','none'));
        }
      });


    }
    // DEV
    this.removeDispo = function(){
      // remove dispo & dispo div
      that.allDispos.pop();
      $("#dispos").find('th:nth-last-child(2)').remove();
      // Remove boxes
      $('.seqLine').each(function(index,div){
        $(div).find('.box:last-child').remove();
      });
      // Reduce allMedias Array
      // project.removeDispo();
      var xToRemove = that.allDispos.length;
      console.log("removing medias with index X: "+xToRemove);
      $.each(project.allScenes,function(index,scene){
        scene.allMedias = scene.allMedias.filter(function( media ) {
          return media.x !== xToRemove;
        });
      });

    }

    // SAVE - interval
    this.savePoolInterval = function(){
      setInterval(function(){
        that.savePool();
      }, 10000);
    }
    // SAVE
    this.savePool = function(){
      // FILL EXPORT ARRAY
      poolExport = [];
      $.each(that.allDispos,function(index,dispo){
        poolExport.push({
          name:dispo.name,
          operator:dispo.operator
        });
      });
      // AJAX
      $.ajax({
        url: "data/save.php",
        dataType: "json",
        type: "POST",
        data: {
            contents: JSON.stringify(poolExport),
            filename: 'pool',
            timestamp: $.now(),
            type: 'pool'
        }
      })
      .done(function(reponse){
        // console.log(reponse.status);
      })
      .fail(function(){
        // console.log('save failed');
      });
    }


    this.loadPool = function(){
      $.ajax({
        url: "data/load.php",
        dataType: "json",
        type: "POST",
        data: {
            filename: 'pool',
            type: 'pool'
        }
      })
      .done(function(reponse) {
        if (reponse.status == 'success')
        {
          poolImport = JSON.parse(reponse.contents);
          $.each(poolImport, function( index, dispo ) {
            that.allDispos.push(new dispoObject(dispo.name, dispo.operator, index));
          });
          initProject();
        }
      });
    }

    // INIT POOL
    this.loadPool();
    this.savePoolInterval();

  }



  ////////////////////////////////////////////////////////////
  /////////////////////////   DISPO   ////////////////////////
  ////////////////////////////////////////////////////////////

  function dispoObject(name, operator, xIndex){

    var that = this;

    // input
    this.name = name;
    this.operator = operator;
    this.xIndex = xIndex;

    // divs
    this.dispoHeader = $('<th><div class="dispo"></div></th>').insertBefore('#addRemoveDispos');
    // naming
    this.dispoNaming =$('<div class="dispoNaming"></div>').appendTo(this.dispoHeader.children());
    this.operatorDiv = $('<div class="operatorEditor textbtn">'+that.operator+'</div>').appendTo(this.dispoNaming);
    this.nameDiv = $('<div class="nameEditor textbtn">'+that.name+'</div>').appendTo(this.dispoNaming);
    //stopper
    this.stop = $('<i class="fa fa-stop btn btnBig stopDispo" aria-hidden="true"></i>').appendTo(this.dispoHeader.children());
    //more btns
    this.dispoMore =$('<div class="dispoMore"></div>').appendTo(this.dispoHeader.children());
    this.mute = $('<i class="fa fa-volume-up btn btnMedium stateOn" aria-hidden="true"></i>').appendTo(this.dispoMore);
    this.loop = $('<i class="fa fa-repeat btn btnMedium stateOn" aria-hidden="true"></i>').appendTo(this.dispoMore);
    this.pause = $('<i class="fa fa-pause btn btnMedium stateOn" aria-hidden="true"></i>').appendTo(this.dispoMore);


    this.allBoxes = new Array();
    $('.seqDiv').each(function(yIndex,seqdiv){
      that.allBoxes.push(new boxObject(seqdiv,that.name, that.xIndex, yIndex));
    });


    // OPERATOR EDIT
    $(that.operatorDiv).click(function(){
      var thatOperatorDiv = this;
      if(editionMode==true){
        $("#textToEditTitle").html("Nom de l'opérateur :");
        $("#textOverlay").fadeIn(fadeTime);
        $("#textToEdit").focus();
        $("#textToEdit").val(that.operator);
        $('#textToEdit').unbind().keypress(function(e){ if(e.keyCode == 13){ e.preventDefault(); thatOperatorDiv.validateText(); } });
        $('.validateText').unbind().click(function(){ thatOperatorDiv.validateText(); });
      }
      //OK
      this.validateText = function(){
        $("#textToEdit").blur();
        $("#textOverlay").fadeOut(fadeTime);
        $(that.operatorDiv).html($("#textToEdit").val());
        that.operator = $("#textToEdit").val();
        pool.savePool();
      }
    });

    // NAME EDIT
    $(that.nameDiv).click(function(){
      var selectedDispo = 'none';
      if(editionMode==true){
        $('.listItem').removeClass('selected');
        $("#dispoOverlay").fadeIn(fadeTime);
        // select
        $(".dispoItem").unbind().click(function(){
          selectedDispo = $(this).html();
          $('.listItem').removeClass('selected'); $(this).addClass('selected');
        });
        // validate
        $(".validateDispo").unbind().click(function(){
          $("#dispoOverlay").fadeOut(fadeTime);
          $(that.nameDiv).html(selectedDispo);
          that.name = selectedDispo;
          pool.savePool();
          that.checkStates();
        });

      }
    });

    // STATES - IN
    this.isConnected = true;
    this.isPaused = false;
    this.isLooping = false;
    this.isMuted = false;

    this.checkStates = function(){
      $.each(disposIncoming,function(index,dispoIn){
        if(that.name==dispoIn.name){
          if(that.isConnected!=dispoIn.isConnected){ that.isConnected=dispoIn.isConnected; that.updateConnectionState(); }
          if(that.isPaused!=dispoIn.isPaused){ that.isPaused=dispoIn.isPaused; that.updatePauseState(); }
          if(that.isLooping!=dispoIn.isLooping){ that.isLooping=dispoIn.isLooping; that.updateLoopingState(); }
          if(that.isMuted!=dispoIn.isMuted){ that.isMuted=dispoIn.isMuted; that.updateMuteState(); }
        }
      });
    }

    this.updateConnectionState = function(){
      if(that.isConnected==false){
        this.dispoHeader.css({opacity:0.4});
        $.each(that.allBoxes,function(index,box){ box.updateConnectionState('disconnected'); });
      }
      if(that.isConnected==true){
        this.dispoHeader.css({opacity:1});
        $.each(that.allBoxes,function(index,box){ box.updateConnectionState('connected'); });
      }
    }
    this.updatePauseState = function(){
      if(that.isPaused==false){ $(that.pause).removeClass('stateOn').addClass('stateOff'); }
      if(that.isPaused==true){ $(that.pause).removeClass('stateOff').addClass('stateOn'); }
    }
    this.updateLoopingState = function(){
      if(that.isLooping==false){ $(that.loop).removeClass('stateOn').addClass('stateOff'); }
      if(that.isLooping==true){ $(that.loop).removeClass('stateOff').addClass('stateOn'); }
    }
    this.updateMuteState = function(){
      if(that.isMuted==true){ $(that.mute).removeClass('stateOn').addClass('stateOff'); }
      if(that.isMuted==false){ $(that.mute).removeClass('stateOff').addClass('stateOn'); }
    }
    this.updateConnectionState();
    this.updatePauseState();
    this.updateLoopingState();
    this.updateMuteState();


    // INTERACTIONS - OUT
    this.stop.click(function(){
      socketEmit('STOP', '/dispo '+that.name);
    });

    this.mute.click(function(){
      socketEmit('MUTE', '/dispo '+that.name+' /isMuted '+that.isMuted);
    });

    this.loop.click(function(){
      socketEmit('LOOP', '/dispo '+that.name+' /isLooping '+that.isLooping);
    });

    this.pause.click(function(){
      socketEmit('PAUSE', '/dispo '+that.name+' /isPaused '+that.isPaused);

    });



    // init
    this.checkStates();

  }


  ////////////////////////////////////////////////////////////
  /////////////////////////   BOX     ////////////////////////
  ////////////////////////////////////////////////////////////

  function boxObject(seqdiv, dispo, xIndex, yIndex){

    var that = this;
    this.box = $('<td class="box"></td>').appendTo($(seqdiv).parent());
    this.mediaDiv = $('<div class="mediaSelector">...</div>').appendTo($(this.box));
    this.loopDiv = $('<div class="loopInfo"><i class="fa fa-repeat loopInfoIcon loopInfo-none" aria-hidden="true"></i></div>').appendTo($(this.box));
    this.media='?';
    this.loop='?';
    this.dispo = dispo;
    this.xIndex = xIndex;
    this.yIndex = yIndex;

    this.getMedia = function(){
      that.media = $(that.box).text();
      if($(that.loopDiv).find('.loopInfoIcon').hasClass('loopInfo-none')){ that.loop = 'none'; }
      if($(that.loopDiv).find('.loopInfoIcon').hasClass('loopInfo-loop')){ that.loop = 'loop'; }
      if($(that.loopDiv).find('.loopInfoIcon').hasClass('loopInfo-unloop')){ that.loop = 'unloop'; }
    }

    this.setMedia = function(media,loop){
      that.loop = loop;
      that.media = media;
      $(that.loopDiv).find('.loopInfoIcon').removeClass('loopInfo-none').removeClass('loopInfo-loop').removeClass('loopInfo-unloop').addClass('loopInfo-'+that.loop);
      $(that.mediaDiv).html(that.media);
    }

    this.updateConnectionState = function(state){
      if(state=='disconnected'){
        this.box.css({opacity:0.4});
      }
      if(state=='connected'){
        this.box.css({opacity:1});
      }
    }

    $(this.box).click(function(){
      if(editionMode==true){
        that.edit();
      }else{
        that.play();
      }
    });

    this.edit=function(){

      var selectedMedia = 'none';
      $('.listItem').removeClass('selected');
      $("#mediaOverlay").fadeIn(fadeTime);
      bindColorPicker();

      // update Radio
      $('input:radio[name="loopArg"]').filter('[value='+that.loop+']').prop('checked', true);
      // update media
      $(".mediaItem").each(function(index,div){
        if($(div).html()==that.media){$(div).addClass('selected');}
      });

      // Select
      $(".mediaItem").unbind().click(function(){
        var selectedDiv = this;
        selectedMedia = $(this).html();
        $('.listItem').removeClass('selected'); $(this).addClass('selected');
        // Color picker
        // if( media = color ) bindColorPicker PLUS change selected media
        if($(selectedDiv).hasClass('mediaColor')){
          $("#mediaColorEdit").unbind().on('change',function(){
            $('.mediaColor').html('color '+$("#mediaColorEdit").val());
            selectedMedia = 'color '+$("#mediaColorEdit").val();
          });
        }

      });

      // validate
      ///////////////////////   SAVE BOX    //////////////////////
      $(".validateMedia").unbind().click(function(){

        $("#mediaOverlay").fadeOut(fadeTime);
        if(selectedMedia!='none') {that.media = selectedMedia;}
        that.loop = $("input[name='loopArg']:checked").val();
        if(that.loop==undefined){ that.loop = 'none' }
        $(that.loopDiv).find('.loopInfoIcon').removeClass('loopInfo-none').removeClass('loopInfo-loop').removeClass('loopInfo-unloop').addClass('loopInfo-'+that.loop);
        $(that.mediaDiv).html(that.media);

        // Save it in project
        // var xIndex = $(that.box).index()-1;
        // var yIndex = $(that.box).parent().index();
        $.each(project.allScenes,function(index,scene){
          if(scene.isActive==true){
            $.each(scene.allMedias,function(index,media){
              if((media.x==that.xIndex)&&(media.y==that.yIndex)){
                media.media = that.media;
                media.loop = that.loop;
                console.log('editing media x:'+that.xIndex+' y:'+that.yIndex+' '+media.media+' '+media.loop);
              }
            });
          }
        });
        project.saveProject();

      });

    }

    this.play=function(){
      that.getMedia();
      socketEmit('PLAY', '/dispo '+that.dispo+' /media '+that.media+' /loop '+that.loop);
    }

  }

    ///////////////////    BOX - MORE    /////////////////////

    function bindColorPicker(){
      $("#mediaColorEdit").unbind().on('change',function(){
        $('.mediaColor').html('color '+$("#mediaColorEdit").val());
      });
    }



  ////////////////////////////////////////////////////////////
  //////////////////////     PROJECT     /////////////////////
  ////////////////////////////////////////////////////////////

  allScenesTemp = ['scene1','scene2','scene3','scene4','scene5','scene6','scene7','scene8','scene9','scene10'];
  allSequencesTemp = ['seq1','seq2','seq3','seq4','seq5','seq6','seq7','seq8','seq9','seq10','seq11','seq12','seq13','seq14','seq15','seq16','seq17','seq18','seq19','seq20' ];
  // projectExport = [];
  projectImport = [];

  var project;


  function initProject(){
    project = new projectObject();
    project.loadProject();
  }


  function projectObject(){

    var that = this;
    that.allScenes = new Array();

    // SAVE - interval
    this.saveProjectInterval = function(){
      setInterval(function(){
        that.saveProject();
      }, 2000);
    }

    // SAVE
    this.saveProject = function(){
      // FILL EXPORT ARRAY
      var projectExport = [];
      // OLD WAY - SAVE ALL SCENES
      // projectExport.push(that.allScenes);
      // NEW WAY - SAVE ALL SCENES QUI SONT ONT UN DOSSIER CORRESPONDANT DANS LE FILETREE - Permet de supprimer les scenes qui n'ont pas de folder
      var allScenesExport = [];
      $.each(fileTree,function(index,folder){
        $.each(that.allScenes,function(index,scene){
          if(scene.name==folder.name){ allScenesExport.push(scene);}
        });
      });
      projectExport.push(allScenesExport);


      // AJAX
      $.ajax({
        url: "data/save.php",
        dataType: "json",
        type: "POST",
        data: {
            contents: JSON.stringify(projectExport),
            filename: 'project',
            timestamp: $.now(),
            type: 'project'
        }
      })
      .done(function(reponse){
        // console.log(reponse.status);
      })
      .fail(function(){
        // console.log('save failed');
      });
    }


    this.loadProject = function(){
      $.ajax({
        url: "data/load.php",
        dataType: "json",
        type: "POST",
        data: {
            filename: 'project',
            type: 'project'
        }
      })
      .done(function(reponse) {
        if (reponse.status == 'success')
        {
          // FROM JSON
          that.allScenes=[];
          projectImport = JSON.parse(reponse.contents);
          // NEW SCENES
          $.each(projectImport[0], function( index, incomingScene ) {
            that.allScenes.push(new sceneObject(incomingScene.name) );
          });
          // EDIT SCENE
          $.each(that.allScenes,function(index,newScene){
            // sequences
            $.each(projectImport[0][index].allSequences,function(index,seqName){
              newScene.allSequences.push(seqName);
            });
            // medias
          $.each(projectImport[0][index].allMedias,function(index,incomingMedia){
              newScene.allMedias.push(new media(incomingMedia.x,incomingMedia.y,incomingMedia.media,incomingMedia.loop));
            });
          });

          // // FROM SCRATCH
          // //NEW SCENES
          // $.each(allScenesTemp,function(index){
          //   that.allScenes.push(new sceneObject(allScenesTemp[index]) );
          // });
          // // EDIT SCENE
          // $.each(that.allScenes,function(index,scene){
          //   // scene.allSequences = allSequencesTemp;
          //   $.each(allSequencesTemp,function(index,seqName){
          //     scene.allSequences.push(seqName);
          //   });
          //   $.each(pool.allDispos,function(indexX,dispo){
          //     for (var indexY = 0; indexY < 20; indexY++) {
          //       scene.allMedias.push(new media(indexX,indexY,'...','none'));
          //     }
          //   });
          // });

          // LOAD FILE SYSTEM
          loadFileTree();
          // LOAD FIRST SCENE
          project.allScenes[0].loadScene();
          $('.sceneEditor').html(project.allScenes[0].name);
        }
      });

    }

    this.createScene = function(newFolderName){
      var newScene = new sceneObject(newFolderName)
      // fill Sequences
      $.each(allSequencesTemp,function(index,seqName){
        newScene.allSequences.push(seqName);
      });
      // fill medias
      $.each(pool.allDispos,function(indexX,dispo){
        for (var indexY = 0; indexY < 20; indexY++) {
          newScene.allMedias.push(new media(indexX,indexY,'...','none'));
        }
      });
      that.allScenes.push(newScene);
    }



    this.saveProjectInterval();


  }


  // SCENE CHANGE
  $('.sceneEditor').click(function(){
    if(editionMode==true){
      var selectedSceneName;
      $('.listItem').removeClass('selected');
      $("#sceneOverlay").fadeIn(fadeTime);
      // select
      $(".sceneItem").unbind().click(function(){
        selectedSceneName = $(this).html();
        $('.listItem').removeClass('selected'); $(this).addClass('selected');
      });
      // validate
      $(".validateFoler").unbind().click(function(){
        $("#sceneOverlay").fadeOut(fadeTime);
        $('.sceneEditor').html(selectedSceneName);
        $.each(project.allScenes,function(index,scene){
          if(scene.name==selectedSceneName){ scene.loadScene(); }
        });
      });
    }
  });




  ////////////////////////////////////////////////////////////
  //////////////////////      SCENE      /////////////////////
  ////////////////////////////////////////////////////////////


  function sceneObject(sceneName){

    var that = this;
    this.isActive = false;
    this.name = sceneName;
    this.allSequences = new Array();
    this.allMedias = new Array();


    this.loadScene = function(){
      // active
      $.each(project.allScenes,function(index,scene){ scene.isActive=false; });
      that.isActive = true;
      //scene names dom
      $('.seqName').each(function(index,div){
        $(div).html(that.allSequences[index]);
      });
      //medias in boxes
      // $.each(that.allMedias,function(index,media){
      //   $('.box').each(function(index,div){
      //     var xIndex = $(div).index()-1;
      //     var yIndex = $(div).parent().index();
      //     if((xIndex==media.x)&&(yIndex==media.y)){
      //       $(this).find('.mediaSelector').html(media.media);
      //       $(this).find('.loopInfoIcon').removeClass('loopInfo-none').removeClass('loopInfo-loop').removeClass('loopInfo-unloop').addClass('loopInfo-'+media.loop);
      //     }
      //   });
      // });
      $.each(that.allMedias,function(index,media){
        $.each(pool.allDispos,function(index,dispo){
          $.each(dispo.allBoxes,function(index,box){
            if((box.xIndex==media.x)&&(box.yIndex==media.y)){
              box.setMedia(media.media,media.loop)
            }
          });
        });
      });
      // mediaList in mediaOverlay
      $('.mediaListDynamic').empty();
      $.each(fileTree,function(index,folder){
        if(folder.name==that.name){
          $.each(folder.files,function(index,fileName){
            $('<div class="listItem mediaItem">'+fileName+'</div>').appendTo($('.mediaListDynamic'));
          });
        }
      });

      console.log('scene loaded: '+that.name);
    }


  }

  ////////////////////////////////////////////////////////////
  //////////////////////     MEDIA     //////////////////////
  ////////////////////////////////////////////////////////////

  function media(x,y,media,loop){
    this.x = x;
    this.y = y;
    this.media = media;
    this.loop = loop;
  }




  ////////////////////////////////////////////////////////////
  //////////////////////    SEQUENCE    //////////////////////
  ////////////////////////////////////////////////////////////

  // SEQUENCE CHANGE
  var editedSequence;

  $('.seqName').click(function(){
    var that = this;
    editedSequence = this;
    var seqName = $(editedSequence).html();
    var sequenceNumber = $(this).parent().parent().index(); // sequence number / Y

    if(editionMode==true){
      $("#textToEditTitle").html("Nom de la séquence :");
      $("#textOverlay").fadeIn(fadeTime);
      $("#textToEdit").focus();
      $("#textToEdit").val(seqName);
      $('#textToEdit').unbind().keypress(function(e){ if(e.keyCode == 13){ e.preventDefault(); that.validateText(); } });
      $('.validateText').unbind().click(function(){ that.validateText(); });
    }else{
      console.log('play sequence');
      $.each(pool.allDispos,function(index,dispo){
        $.each(dispo.allBoxes,function(index,box){
          if(box.yIndex==sequenceNumber){box.play();}
        });
      });
    }
    // OK
    this.validateText = function(){
      $("#textToEdit").blur();
      $("#textOverlay").fadeOut(fadeTime);
      $(editedSequence).html($("#textToEdit").val());
      $.each(project.allScenes,function(index,scene){
        if(scene.isActive==true){
          scene.allSequences[sequenceNumber] = $("#textToEdit").val();
        }
      });
      project.saveProject();
    }
  });


  // ERASE
  $(".eraseSequence").click(function(){
    var that=this;
    var sequenceNumber = $(this).parent().parent().parent().index();
    // dom
    // var seqLine = $(this).parent().parent().parent();
    // $(seqLine).find('.box').each(function(index,box){
    //   $(box).find('.mediaSelector').html('...');
    //   $(box).find('.loopInfoIcon').removeClass('loopInfo-loop').removeClass('loopInfo-unloop').addClass('loopInfo-none');
    // });
    $.each(pool.allDispos,function(index,dispo){
      $.each(dispo.allBoxes,function(index,box){
        if(box.yIndex==sequenceNumber){box.setMedia('...','none');}
      });
    });
    // data
    $.each(project.allScenes,function(index,scene){
      if(scene.isActive==true){
        $.each(scene.allMedias,function(index,media){
          if(media.y==sequenceNumber){ media.media='...'; media.loop='none'; }
        });
      }
    });
  });


  // COPY / PASTE
  var copying = false;
  var clipboard = [];
  $('.copyPasteSequence').click(function(){
    var that = this;
    var sequenceNumber = $(this).parent().parent().parent().index(); // sequence number / Y
    // COPY
    if(copying==false){
      $('.copyPasteSequence').removeClass('fa-clipboard').addClass('fa-files-o');
      copying=true;
      clipboard = [];
      $.each(project.allScenes,function(index,scene){
        if(scene.isActive==true){
          $.each(scene.allMedias,function(index,media){
            if(media.y==sequenceNumber){clipboard.push(media);}
          });
        }
      });
      return;
    }
    // PASTE
    if(copying==true){
      $('.copyPasteSequence').removeClass('fa-files-o').addClass('fa-clipboard');
      copying=false;
      // Dom
      // dom - Media
      // $(that).parent().parent().parent().find('.mediaSelector').each(function(indexX,div){
      //   $.each(clipboard,function(index,media){
      //     if(media.x==indexX){ $(div).html(media.media); }
      //   });
      // });
      // // dom - loop
      // $(that).parent().parent().parent().find('.loopInfoIcon').each(function(indexX,div){
      //   $.each(clipboard,function(index,media){
      //     if(media.x==indexX){ $(div).removeClass('loopInfo-none').removeClass('loopInfo-loop').removeClass('loopInfo-unloop').addClass('loopInfo-'+media.loop); }
      //   });
      // });
      $.each(clipboard,function(index,media){
        $.each(pool.allDispos,function(index,dispo){
          $.each(dispo.allBoxes,function(index,box){
            if((box.xIndex==media.x)&&(box.yIndex==sequenceNumber)){
              box.setMedia(media.media,media.loop)
            }
          });
        });
      });

      // memory
      $.each(project.allScenes,function(index,scene){
        if(scene.isActive==true){
          $.each(scene.allMedias,function(index, media){
            if(media.y==sequenceNumber){
              $.each(clipboard,function(index, clipboardmedia){
                if(media.x==clipboardmedia.x){ media.media = clipboardmedia.media; media.loop = clipboardmedia.loop; }
              });
            }
          });
        }
      });
      project.saveProject();
      return;
    }



  });


  ////////////////////////////////////////////////////////////
  ///////////////////////   INCOMING  ////////////////////////
  ////////////////////////////////////////////////////////////


  ////////////////////////   FILES  /////////////////////////
  var fileTree = [
    { name: 'scene1', files: ["media1-1.mp4","media1-2.mp4","media1-3.mp4","media1-4.mp4","media1-5.mp4","media1-6.mp4","media1-7.mp4","media1-8.mp4","media1-9.mp4"] },
    { name: 'scene2', files: ["media2-1.mp4","media2-2.mp4","media2-3.mp4","media2-4.mp4","media2-5.mp4","media2-6.mp4","media2-7.mp4","media2-8.mp4","media2-9.mp4"] },
    { name: 'scene3', files: ["media3-1.mp4","media3-2.mp4","media3-3.mp4","media3-4.mp4","media3-5.mp4","media3-6.mp4","media3-7.mp4","media3-8.mp4","media3-9.mp4"] },
    { name: 'scene4', files: ["media4-1.mp4","media4-2.mp4","media4-3.mp4","media4-4.mp4","media4-5.mp4","media4-6.mp4","media4-7.mp4","media4-8.mp4","media4-9.mp4"] },
    { name: 'scene5', files: ["media5-1.mp4","media5-2.mp4","media5-3.mp4","media5-4.mp4","media5-5.mp4","media5-6.mp4","media5-7.mp4","media5-8.mp4","media5-9.mp4"] },
    { name: 'scene6', files: ["media6-1.mp4","media6-2.mp4","media6-3.mp4","media6-4.mp4","media6-5.mp4","media6-6.mp4","media6-7.mp4","media6-8.mp4","media6-9.mp4"] },
    { name: 'scene7', files: ["media7-1.mp4","media7-2.mp4","media7-3.mp4","media7-4.mp4","media7-5.mp4","media7-6.mp4","media7-7.mp4","media7-8.mp4","media7-9.mp4"] },
    { name: 'scene8', files: ["media8-1.mp4","media8-2.mp4","media8-3.mp4","media8-4.mp4","media8-5.mp4","media8-6.mp4","media8-7.mp4","media8-8.mp4","media8-9.mp4"] },
    { name: 'scene9', files: ["media9-1.mp4","media9-2.mp4","media9-3.mp4","media9-4.mp4","media9-5.mp4","media9-6.mp4","media9-7.mp4","media9-8.mp4","media9-9.mp4"] }
  ]


  // ATTENTION - à réception du filetree en socket, vider le tableau fileTree et le remplacer par celui recu,
  // PUIS loadFileTree

  function loadFileTree(){

    // DOM
    $('.sceneList').empty();
    $.each(fileTree,function(index,folder){
      $('<div class="listItem sceneItem">'+folder.name+'</div>').appendTo($('.sceneList'));
    });
    // NEW SCENE (IF NEW FOLDER)
    var allSceneNames = [];
    $.each(project.allScenes,function(index,scene){ allSceneNames.push(scene.name);});
    $.each(fileTree,function(index,folder){
      if($.inArray(folder.name,allSceneNames)==-1){
        project.createScene(folder.name);
      }
    });

  }


  ////////////////////////   DISPOS   /////////////////////////


  var disposIncoming = [
    { name: 'RPi1', isConnected: true, isPaused: false, isLooping: false, isMuted: false },
    { name: 'RPi2', isConnected: true, isPaused: false, isLooping: true, isMuted: false },
    { name: 'RPi3', isConnected: false, isPaused: false, isLooping: false, isMuted: false },
    { name: 'RPi4', isConnected: true, isPaused: false, isLooping: false, isMuted: false },
    { name: 'Bus', isConnected: true, isPaused: false, isLooping: false, isMuted: false },
    { name: 'Camion', isConnected: true, isPaused: false, isLooping: false, isMuted: false },
    { name: 'Panneau', isConnected: true, isPaused: false, isLooping: false, isMuted: false },
    { name: 'Charrette', isConnected: true, isPaused: false, isLooping: false, isMuted: false },
    { name: 'Poubelle', isConnected: true, isPaused: false, isLooping: false, isMuted: false }
  ];

  function loadDispoNames(){
    $(".dispoList").empty();
    $.each(disposIncoming,function(index,dispo){
      $('<div class="listItem dispoItem">'+dispo.name+'</div>').appendTo($('.dispoList'));
    });
  }

  function updateDispoStates(){
    $.each(pool.allDispos,function(index,dispo){
      dispo.checkStates();
    });
  }

  loadDispoNames();
  updateDispoStates();


  ////////////////////////////////////////////////////////////
  ///////////////////////   SOCKETIO  ////////////////////////
  ////////////////////////////////////////////////////////////

  url = 'http://localhost:1111';
  var socket = io(url);

  // CONNECT
  socket.on('connect', function(){
    console.log('Connected to Server: '+url);
    $('.connectionStateText').text('connecté');
    $('.connectionState').removeClass('disconnected').addClass('connected');
  });

  socket.on('disconnect', function(){
    $('.connectionStateText').text('recherche');
    $('.connectionState').removeClass('connected').addClass('disconnected');
  });

  // RECEIVE
  socket.on('fileTree', function(data){
    console.log(data);
  });
  socket.on('disposInfos', function(data){
    console.log(data);
    disposIncoming = data;
    loadDispoNames();
    updateDispoStates();
  });

  // SEND
  function socketEmit(msgType, msg){
    console.log(msgType+' '+msg);
    socket.emit(msgType, msg);
  }





















});
