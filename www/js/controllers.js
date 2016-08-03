angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $rootScope, $ionicModal, $ionicPlatform, $localStorage, $state, $ionicPopup) {

  /*INIT SOCKET*/
  $rootScope.socket = io.connect("127.0.0.1:3000");

  $scope.$on('$ionicView.enter', function(event, data) {
    if(data.stateName == 'app.general' && $rootScope.izziVisio){
      $rootScope.socket.emit("end_call", {id : $rootScope.idCaller});
      $rootScope.izziVisio.closeConnection();
    }
  });

  $rootScope.global = {
    applyScope: function () {
      var interval = setInterval(function () {
        if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
          clearInterval(interval);
          $scope.$apply();
        }
      }, 20);
    }
  };

  $scope.initEventListeners = function(){

    $scope.callUser = function(pseudo, id){
      $state.go('app.calling', {pseudo:pseudo,id: id});
    };

    $rootScope.socket.on("get_call_event",function(data){

      $rootScope.pseudoCaller = data.pseudo;
      $rootScope.idCaller     = data.id;

      var confirmPopup = $ionicPopup.confirm({
        title: 'Appel entrant',
        template: 'Vous avez un appel de ' + $rootScope.pseudoCaller
      });

      confirmPopup.then(function(res) {
        if(res) {
          $state.go('app.calling', {pseudo:null,id: null});
        } else {
        }
      });

    });

    $rootScope.socket.on("set_remote_description_event",function(data){
      $rootScope.izziVisio.remoteDescription({
        description : data.data,
        set_local_description : function(description){
          $rootScope.socket.emit("set_local_description", { data : description, id : $rootScope.idCaller});
        }
      });
    });

    $rootScope.socket.on("add_remote_candidate_event",function(data){
      $rootScope.izziVisio.setRemoteCandidate({
        candidate : data.data
      });
    });

    $rootScope.socket.on("end_call_event",function(data){
      $state.go('app.general');
    });

    $rootScope.socket.on("set_local_description_event",function(data){
      $rootScope.izziVisio.setLocalDescription({
        description : data.data
      });
    });

    $rootScope.socket.on("add_local_candidate_event",function(data){
      $rootScope.izziVisio.setLocalCandidate({
        candidate : data.data
      });
    });

    $rootScope.socket.on("send_liste_users",function(data){

      $rootScope.connectedUsers.users = [];

      $.each(data.users, function(index, value) {
        if(value.pseudo != $rootScope.pseudoUser){
          $rootScope.connectedUsers.users.push(value);
        }
      });

      $rootScope.global.applyScope();
    });

    $rootScope.socket.on("accept_call_event",function(data){
      $rootScope.acceptedCall();
    });

    cordova.plugins.iosrtc.registerGlobals();

    $rootScope.socket.emit("init_user_media", {'pseudo':$rootScope.pseudoUser});
  };

  $scope.submitPseudo = function(user){
    $localStorage.set('pseudoUser',user.pseudo);
    $rootScope.pseudoUser = user.pseudo;
    $scope.loginModal.hide();

    $scope.initEventListeners();
  };

  /*GET USER SOCKET ID*/
  $rootScope.socket.on("send_user_id",function(data){
    $rootScope.localID = data.socketID;
  });

  /*CHECK IF USER ALREADY LOGGED IN*/
  $rootScope.pseudoUser = $localStorage.get("pseudoUser",null);

  $scope.initLoginModal = function(){
    $ionicModal.fromTemplateUrl('templates/modal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.loginModal = modal;
      $scope.loginModal.show();
    });
  };

  if($rootScope.pseudoUser == null){
    /*DISPLAY LOGIN MODAL*/
    $scope.initLoginModal();
  }else{
    $scope.initEventListeners();
  }

})

.controller('GeneralController', function($scope,$rootScope) {

  $rootScope.messages = [
    {id: 1, user: 'John Do', avatar:'img/avatar1.gif', date:'10:43 AM', text : 'Called for 1m30' }
  ];

  $rootScope.connectedUsers = {};
  $rootScope.connectedUsers.users = [];
})

.controller('CallingController', function($scope,$rootScope, $stateParams) {
  $scope.pseudo = $stateParams.pseudo;

  $rootScope.izziVisio = izziVisioConference({
    stun : {
      urls :'stun:stun.l.google.com:19302'
    },
    turn : {
      urls: 'turn:turn.bistri.com:80',
      credential: 'homeo',
      username: 'homeo'
    },
    audio : true,
    video : true,
    localVideoElement : document.querySelector("#video"),
    localStreamInited : function(){
      if($stateParams.id && $stateParams.pseudo){
        $rootScope.socket.emit("make_call", { message : 'make_call', id : $stateParams.id, pseudo : $rootScope.pseudoUser});
        $rootScope.idCaller     = $stateParams.id;
      }else{
        $rootScope.socket.emit("accept_call", { id : $rootScope.idCaller});

        $rootScope.izziVisio.createLocalConnection({
          sendLocalCandidate : function(event){
            if(event.candidate){
              $rootScope.socket.emit("add_remote_candidate", { data : event.candidate, id : $rootScope.idCaller});
            }
          },
          localDescription : function(description){
            $rootScope.socket.emit("set_remote_description", { data : description, id : $rootScope.idCaller});
          }
        });

        $rootScope.izziVisio.createRemoteConnection({
          remoteVideoElement : document.querySelector("#remoteVideo"),
          sendRemoteCandidate : function(event){
            if(event.candidate){
              $rootScope.socket.emit("add_local_candidate", { data : event.candidate, id : $rootScope.idCaller});
            }
          }
        });
      }
    }
  });

  $rootScope.acceptedCall = function(){
    $rootScope.izziVisio.createLocalConnection({
      sendLocalCandidate : function(event){
        if(event.candidate){
          $rootScope.socket.emit("add_remote_candidate", { data : event.candidate, id : $rootScope.idCaller});
        }
      },
      localDescription : function(description){
        $rootScope.socket.emit("set_remote_description", { data : description, id : $rootScope.idCaller});
      }
    });

    $rootScope.izziVisio.createRemoteConnection({
      remoteVideoElement : document.querySelector("#remoteVideo"),
      sendRemoteCandidate : function(event){
        if(event.candidate){
          $rootScope.socket.emit("add_local_candidate", { data : event.candidate, id : $rootScope.idCaller});
        }
      }
    });
  };

});
