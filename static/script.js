var startPosition = {
        a1: 'bP',
        c1: 'bP',
        e1: 'bP',
        g1: 'bP',
        b2: 'bP',
        d2: 'bP',
        f2: 'bP',
        h2: 'bP',
        a3: 'bP',
        c3: 'bP',
        e3: 'bP',
        g3: 'bP',
        b8: 'wP',
        d8: 'wP',
        f8: 'wP',
        h8: 'wP',
        a7: 'wP',
        c7: 'wP',
        e7: 'wP',
        g7: 'wP',
        b6: 'wP',
        d6: 'wP',
        f6: 'wP',
        h6: 'wP'
        };

     
        

        var board = new Chessboard('myBoard', ChessUtils.FEN.emptyId);
        var socket = io.connect();
        var username;
        var turn= false;
        var color;
        var clicked= false;
        var pieces;
        var squares;
        var pieceIDClicked;
        var matrix= [];
        var yourPiece;
        var yourDraughts;
        var opponentPiece;
        var opponentDraughts;
        var pieceLegalmoves;
        var pieceLegalID=[];
        var boardNumberArray=[];
        var boardCharArray=[];
        var eatenTurnCount=0;
        var eatingChain=false;
        var gameModeAI=false;
        var canSelectGamePlay=false;
        var evaluationType;
        var selectedDepth;
       



        function sendUsername(){
               
                var fieldUsername=document.getElementById("fieldUsername");
                if(fieldUsername.value!=""){
                        
                        document.getElementById('userFormError').innerHTML="";
                        socket.emit('username',fieldUsername.value);
                        fieldUsername.value="";
                        

                }else{
                         
                    document.getElementById('userFormError').innerHTML='<br>'+
                                                                     '<div class="ui error message" style="display: block;">'+
                                                                    '<div class="header">Please insert a Username</div>'+
                                                                    '</div>';
 
                     
                }
                
        }


       


        socket.on('username', function(response){
                if(response.msg=="UserOk"){
                        username=response.username;
                        gamePlayModeSelection();
                        canSelectGamePlay=true;
                        
                        
                }else{
                       document.getElementById('userFormError').innerHTML='<br>'+
                                                                     '<div class="ui error message" style="display: block;">'+
                                                                    '<div class="header">Username already in use</div>'+
                                                                    '</div>';
                }


        });

        function gamePlayModeSelection(){
            document.getElementById("sideNav").innerHTML='<div class="ui icon message">'+
                                                                      '<i class="trophy icon"></i>'+
                                                                      '<div class="content">'+
                                                                       '<div class="header">'+
                                                                       'You are now ready to play!'+
                                                                        '</div>'+
                                                                      '<p>Choose multiplayer mode or AI mode</p>'+
                                                                        '</div>'+
                                                                        '</div>'+
                                                                        '<br>'+
                                                                        '<br>'+
                                                                        '<div class="ui massive buttons">'+
                                                                        '<button class="ui black button" onclick="findPlayer()">Multiplayer</button>'+
                                                                        '<div class="or"></div>'+
                                                                        '<button class="ui black button" onclick="gameParameterSelection()">AI</button>'+
                                                                        '</div>';
        }

        function findPlayer(){
                
                document.getElementById("sideNav").innerHTML='<div class="ui segment" style="width:100%;height:30vh;">'+
                                                              '<div class="ui active  dimmer">'+
                                                              '<div class="ui text loader"><h2>Searching a player</></div>'+
                                                               '</div>'+
                                                               '<p></p>'+
                                                                '</div>';

                socket.emit('multiplayerRequest',"");

       


        }


        function gameParameterSelection(){

            document.getElementById("sideNav").innerHTML='<br>'+
                                                         '<br>'+
                                                         '<div class="ui message">'+
                                                         '<div class="header">'+
                                                         'Select your game parameters to test:'+
                                                         '</div>'+
                                                         '<ul class="list">'+
                                                         '<li>Evaluation function type</li>'+
                                                         '<li>Game tree Depth</li>'+
                                                         '</ul>'+
                                                         '</div>'+
                                                         '<br>'+
                                                         '<br>'+
                                                         '<div class="grouped fields" id="groupedFields">'+
                                                         '<div class="field">'+
                                                         '<div class="ui radio checkbox">'+
                                                         '<input type="radio" name="evaluation" checked="checked" value="Pieces">'+
                                                         '<label id="evalSelection">Number of Pieces</label>'+
                                                         '</div>'+
                                                         '</div>'+
                                                         '<div class="field">'+
                                                         '<div class="ui radio checkbox">'+
                                                         '<input type="radio" name="evaluation" value="BoardPosition">'+
                                                         '<label id="evalSelection">Board Position</label>'+
                                                         '</div>'+
                                                         '</div>'+
                                                         '<div class="field">'+
                                                         '<div class="ui radio checkbox">'+
                                                         '<input type="radio" name="evaluation" value="BoardPositionNormalized">'+
                                                         '<label id="evalSelection">Board Position Normalized</label>'+
                                                         '</div>'+
                                                         '</div>'+
                                                         '<div class="field">'+
                                                         '<div class="ui radio checkbox">'+
                                                         '<input type="radio" name="evaluation" value="RowPosition">'+
                                                         '<label id="evalSelection">Row Position</label>'+
                                                         '</div>'+
                                                         '</div>'+
                                                         '</div>'+
                                                         '<br>'+
                                                         '<br>';

          var htmlString='<label>Depth:</label>&nbsp&nbsp&nbsp'+
                        '<select class="ui dropdown" id="depthDropdown">';
          for (var i = 1; i <11; i++) {
            htmlString+='<option value="'+i+'">'+i+'</option>';
          }
          htmlString+='</select>';                                              
          document.getElementById("sideNav").innerHTML+=htmlString+
                                                        '<br>'+
                                                        '<br>'+
                                                        '<br>'+
                                                        '<button class="ui secondary button" onclick="AIRequest()">'+
                                                        'Play'+
                                                        '</button>';


          
          $('.ui.radio.checkbox').checkbox();
          

                                                       
 

        }



        function AIRequest(){
            evaluationType=$('input[name=evaluation]:checked').val();
            selectedDepth=$("#depthDropdown option:selected").val();
            socket.emit("AIRequest","");
            gameModeAI=true;
        }






        socket.on("opponentFinded",function(response){

              
              gameSetUp(response);
                                                            
                                                            

        });


        function gameSetUp(response){

            board = new Chessboard('myBoard',startPosition);
            turn=response.turn;
            color=response.color;
            if(response.color=="white"){
                board.setOrientation(ChessUtils.ORIENTATION.flip);
            }
            document.getElementById("sideNav").innerHTML=    '<div class="item">'+
                                                             '<a class="ui tiny image">'+
                                                            '<img src="'+response.opponentImage+'">'+
                                                           '</a>'+

                                                           '<div class="content">'+
                                                           '<h2>Opponent: '+response.opponentUsername+'</h2>'+
                                                           '<div class="description">'+
                                                           '<div class="ui indicating progress" id="opponentProgress" data-value="0" data-total="12">'+
                                                            '<div class="bar"></div>'+
                                                            '</div>'+
                                                            '</div>'+
                                                            '</div>'+
                                                            '</div>'+
                                                            '<br>'+
                                                            '<h2 class="ui horizontal divider header">'+
                                                            '<i class="game icon"></i>'+
                                                            '</h2>'+
                                                            '<br>'+
                                                            '<div class="item">'+
                                                         '<a class="ui tiny image">'+
                                                          '<img src="'+response.image+'">'+
                                                          '</a>'+

                                                           '<div class="content">'+
                                                           '<h2>You: '+username+'</h2>'+
                                                           '<div class="description">'+
                                                           '<div class="ui indicating progress" id="yourProgress" data-value="0" data-total="12">'+
                                                            '<div class="bar"></div>'+
                                                            '</div>'+
                                                            '</div>'+
                                                            '</div>'+
                                                            '</div>'+
                                                             '<div id="turn">'+
                                                             '</div>';
              
         turnMessage();                                     

         pieces=document.getElementsByClassName("chess_piece chess_piece_pawn chess_player_"+response.color);
         for (var i = 0; i < pieces.length; i++) {
             pieces[i].setAttribute("onclick","pieceClicked(this.getAttribute('id'))");
         }

         squares=document.getElementsByClassName("chess_piece chess_piece_none");
         for (var i = 0; i < squares.length; i++) {
             squares[i].setAttribute("onclick","squareClicked(this.getAttribute('id'))");

         }


         initializeMatrix();

        }



        function resetClickAttributes(){

          for (var i = 0; i < pieces.length; i++) {
               pieces[i].removeAttribute("onclick");
           }

           for (var i = 0; i < squares.length; i++) {
               squares[i].removeAttribute("onclick");

           }

            pieces=document.getElementsByClassName("chess_piece chess_piece_pawn chess_player_"+color);
           for (var i = 0; i < pieces.length; i++) {
               pieces[i].setAttribute("onclick","pieceClicked(this.getAttribute('id'))");
           }

           squares=document.getElementsByClassName("chess_piece chess_piece_none");
           for (var i = 0; i < squares.length; i++) {
               squares[i].setAttribute("onclick","squareClicked(this.getAttribute('id'))");

           }

        }





        function initializeMatrix(){
            for (var i = 0; i < 8; i++) {
                matrix[i]=[];
                for(var j=0; j<8; j++){
                    matrix[i][j]=0;
                }
            }
            
            if(color=="white"){
                yourPiece=1;
                yourDraughts=2;
                opponentPiece=3;
                opponentDraughts=4;
                boardNumberArray=[1,2,3,4,5,6,7,8];
                boardCharArray=["h","g","f","e","d","c","b","a"];
            }else{
                yourPiece=3;
                yourDraughts=4;
                opponentPiece=1;
                opponentDraughts=2;
                boardNumberArray=[8,7,6,5,4,3,2,1];
                boardCharArray=["a","b","c","d","e","f","g","h"];
            }
            matrix[0][1]=opponentPiece;
            matrix[0][3]=opponentPiece;
            matrix[0][5]=opponentPiece;
            matrix[0][7]=opponentPiece;
            matrix[1][0]=opponentPiece;
            matrix[1][2]=opponentPiece;
            matrix[1][4]=opponentPiece;
            matrix[1][6]=opponentPiece;
            matrix[2][1]=opponentPiece;
            matrix[2][3]=opponentPiece;
            matrix[2][5]=opponentPiece;
            matrix[2][7]=opponentPiece;

            matrix[5][0]=yourPiece;
            matrix[5][2]=yourPiece;
            matrix[5][4]=yourPiece;
            matrix[5][6]=yourPiece;
            matrix[6][1]=yourPiece;
            matrix[6][3]=yourPiece;
            matrix[6][5]=yourPiece;
            matrix[6][7]=yourPiece;
            matrix[7][0]=yourPiece;
            matrix[7][2]=yourPiece;
            matrix[7][4]=yourPiece;
            matrix[7][6]=yourPiece;



            


        }


        function idConversion(id){
            var count=0;
            var index;
            for (var i = 0; i <matrix.length; i++) {
                for(var j=0; j<matrix[i].length;j++){
                    if(count==id){
                        index={i:i,j:j};
                        return index;
                    }else{
                        count++;
                    }
                }
            }

        }

        function indexConversion(index){
            var count=0;
            for(var i=0;i<matrix.length;i++){
                for (var j = 0; j<matrix[i].length; j++) {
                    if(i==index.i && j==index.j){
                        return count;
                    }else{
                        count++;
                    }
                }
            }
        }

        function indexToPositionString(index){
            var positionString=boardCharArray[index.j]+boardNumberArray[index.i];
            return positionString;
        }


        function isIDLegal(id){
          var control=false;

          for (var i = 0; i < pieceLegalID.length; i++) {
            if(pieceLegalID[i]==id){
              control=true;
              return control;
            }
          }
          return false;
        }

        function getMove(id){
          var index= idConversion(id);
          for (var i = 0; i < pieceLegalmoves.length; i++) {
            if(pieceLegalmoves[i].i==index.i && pieceLegalmoves[i].j==index.j){
              return pieceLegalmoves[i];
            }
          }
        }


       

        function opponentIndexConversion(index){
          var i=0;
          var j=0;
          var temp;
          i=index.j;
          j=7-index.i;
          temp=i;
          i=j;
          j=7-temp;
          var newIndex={i:i,j:j};
          return newIndex;

        }

        function newBoardPosition(){
          var newPosition={};
          for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j < matrix[i].length; j++) {
               var index={i:i,j:j};
               var pos=indexToPositionString(index);
               if(matrix[i][j]==1 || matrix[i][j]==2){
                newPosition[pos]="wP";
               }else if(matrix[i][j]==3 || matrix[i][j]==4){
                newPosition[pos]="bP";
               }
            }
          }
          board.setPosition(newPosition);


        }


        function rotateMatrix(matrix){
          var newMatrix=[];
          newMatrix=initializeMatrix(newMatrix);
          for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j < matrix[i].length; j++) {
              var index={i:i,j:j};
              var newIndex=opponentIndexConversion(index);
              newMatrix[newIndex.i][newIndex.j]=matrix[i][j];
              
            }
          }
          return newMatrix;
        }

                                                          


           $('.modal').modal({
         onHide: function () {
             gameEnd();
         }
       });

        function gameEnd(){
            if(canSelectGamePlay){
             gamePlayModeSelection();
             board = new Chessboard('myBoard', ChessUtils.FEN.emptyId);
             socket.emit("exitGamePlay","");
             gameModeAI=false;

           }

        }

        socket.on("opponentDisconnected",function(response){
             $('#disconnectedModal')
                .modal('show')
                ;

        });

      
      function turnMessage(){
           if(turn){
           document.getElementById("turn").innerHTML=    '<div class="ui icon message">'+
                                                         '<a class="ui tiny image">'+
                                                          '<img src="avatar.png">'+
                                                          '</a>'+
                                                          '<div class="content">'+
                                                          '<div class="header">'+
                                                          'It\'s your turn! <br> Choose your best move!'+
                                                          '</div>'+
                                                          '<br>'+
                                                          '</div>'+
                                                          '</div>';
            }else{
              document.getElementById("turn").innerHTML='<div class="ui icon message">'+
                                                        '<i class="hourglass start icon"></i>'+
                                                        '<div class="content">'+
                                                        '<div class="header">'+
                                                        'It\'s your opponent\'s turn!'+
                                                        '</div>'+
                                                        '<p>Wait for his move</p>'+
                                                        '</div>'+
                                                        '</div>';
            }

      }


        function hideModal(){
            $('.ui.basic.modal')
                .modal('hide')
                ;
        }


        function pieceClicked(id){
            

            if(turn && clicked==false){

                var idNumber= id.split("myBoard_chess_piece_");  
                var index=idConversion(idNumber[1]); 
                pieceIDClicked=id;
                document.getElementById(id).style.border="2px solid yellow";
                clicked=true;
                if(eatingChain){
                  removeHighlightLegalMoves(pieceLegalID);
                  pieceLegalmoves=canEatAgain(index);
                }else{
                pieceLegalmoves=getLegalMoves(index);
                }
                pieceLegalID=[];
                var eatingObligation=checkEatingObligation();
                for (var i = 0; i < pieceLegalmoves.length; i++) {
                    if((eatingObligation && pieceLegalmoves[i].eatenIndex!="")|| eatingObligation==false){
                    pieceLegalID.push(indexConversion(pieceLegalmoves[i]));
                  }
                    
                }
                highlightLegalMoves(pieceLegalID);

            }else if(clicked==true && id==pieceIDClicked && eatingChain==false){

                document.getElementById(id).style.border="";
                removeHighlightLegalMoves(pieceLegalID);
                clicked=false;
            }
                
            

        }


        function highlightLegalMoves(legalID){
            for (var i = 0; i < legalID.length; i++) {
                var id="myBoard_chess_piece_"+legalID[i];
                document.getElementById(id).style.border="2px solid yellow";
                document.getElementById(id).style.opacity="initial";
             
                
                
            }
            
        }


        function removeHighlightLegalMoves(legalID){
            for (var i = 0; i < legalID.length; i++) {
                var id="myBoard_chess_piece_"+legalID[i];
                document.getElementById(id).style.border="";
            }
        }

        function removeAllHighlited(){
          var elements= document.getElementsByClassName("chess_piece chess_piece_pawn chess_player_white");
          for (var i = 0; i < elements.length; i++) {
            elements[i].style.border="";
          }
          elements=document.getElementsByClassName("chess_piece chess_piece_pawn chess_player_black");
          for (var i = 0; i < elements.length; i++) {
            elements[i].style.border="";
          }
        }


        

        function highlightDraught(index){
          var id=indexConversion(index);
          id="myBoard_chess_piece_"+id;
          var element= document.getElementById(id);
          var html=element.innerHTML;
                  html='<a class="ui left corner label">'+
                       '<i class="star icon"></i>'+
                       '</a>'+html;
                  element.innerHTML=html;  
        }


        function removeDraught(index){
          var id=indexConversion(index);
          id="myBoard_chess_piece_"+id;
          var element= document.getElementById(id);
          while (element.firstChild) {
               element.removeChild(element.firstChild);
           }

        }

        


         function getLegalMoves(index){
             var legalMoves=[];
             if(matrix[index.i-1]!=undefined && matrix[index.i-1][index.j-1]!=undefined && matrix[index.i-1][index.j-1]==0){
                var possibleMove={i:index.i-1,j:index.j-1,eatenCount:0,eatenIndex:""};
                legalMoves.push(possibleMove);
                
             }
             if(matrix[index.i-1]!=undefined && matrix[index.i-1][index.j+1]!=undefined && matrix[index.i-1][index.j+1]==0){
                var possibleMove={i:index.i-1,j:index.j+1,eatenCount:0,eatenIndex:""};
                legalMoves.push(possibleMove);
                
             }

             if(matrix[index.i-1]!=undefined && matrix[index.i-1][index.j+1]!=undefined && (matrix[index.i-1][index.j+1]==opponentPiece || matrix[index.i-1][index.j+1]==opponentDraughts)){
                  if(matrix[index.i-2]!=undefined && matrix[index.i-2][index.j+2]!=undefined && matrix[index.i-2][index.j+2]==0){
                    var eatenIndex={i:index.i-1,j:index.j+1};
                    var possibleMove={i:index.i-2,j:index.j+2,eatenCount:1,eatenIndex:eatenIndex};
                    legalMoves.push(possibleMove);
                  }
             }

             if(matrix[index.i-1]!=undefined && matrix[index.i-1][index.j-1]!=undefined && (matrix[index.i-1][index.j-1]==opponentPiece || matrix[index.i-1][index.j-1]==opponentDraughts)){
                  if(matrix[index.i-2]!=undefined && matrix[index.i-2][index.j-2]!=undefined && matrix[index.i-2][index.j-2]==0){
                    var eatenIndex={i:index.i-1,j:index.j-1};
                    var possibleMove={i:index.i-2,j:index.j-2,eatenCount:1,eatenIndex:eatenIndex};
                    legalMoves.push(possibleMove);
                  }
             }

             if(matrix[index.i][index.j]==yourDraughts){
                if(matrix[index.i+1]!=undefined && matrix[index.i+1][index.j-1]!=undefined && matrix[index.i+1][index.j-1]==0){
                  var possibleMove={i:index.i+1,j:index.j-1,eatenCount:0,eatenIndex:""};
                  legalMoves.push(possibleMove);

                }
                if(matrix[index.i+1]!=undefined && matrix[index.i+1][index.j+1]!=undefined && matrix[index.i+1][index.j+1]==0){
                  var possibleMove={i:index.i+1,j:index.j+1,eatenCount:0,eatenIndex:""};
                  legalMoves.push(possibleMove);
                }
                if(matrix[index.i+1]!=undefined && matrix[index.i+1][index.j+1]!=undefined && (matrix[index.i+1][index.j+1]==opponentPiece || matrix[index.i+1][index.j+1]==opponentDraughts)){
                    if(matrix[index.i+2]!=undefined && matrix[index.i+2][index.j+2]!= undefined && matrix[index.i+2][index.j+2]==0){
                      var eatenIndex={i:index.i+1,j:index.j+1};
                      var possibleMove={i:index.i+2,j:index.j+2,eatenCount:1,eatenIndex:eatenIndex};
                      legalMoves.push(possibleMove);
                    }
                }

                if(matrix[index.i+1]!= undefined && matrix[index.i+1][index.j-1]!=undefined && (matrix[index.i+1][index.j-1]==opponentPiece || matrix[index.i+1][index.j-1]==opponentDraughts)){
                  if(matrix[index.i+2]!=undefined && matrix[index.i+2][index.j-2]!=undefined && matrix[index.i+2][index.j-2]==0){
                    var eatenIndex={i:index.i+1,j:index.j-1};
                    var possibleMove={i:index.i+2,j:index.j-2,eatenCount:1,eatenIndex:eatenIndex};
                    legalMoves.push(possibleMove);
                  }
                }
             }

            return legalMoves;

        }


        function canEatAgain(index){
          var legalMoves=[];

          if(matrix[index.i-1]!=undefined && matrix[index.i-1][index.j+1]!=undefined && (matrix[index.i-1][index.j+1]==opponentPiece || matrix[index.i-1][index.j+1]==opponentDraughts)){
                  if(matrix[index.i-2]!=undefined && matrix[index.i-2][index.j+2]!=undefined && matrix[index.i-2][index.j+2]==0){
                    var eatenIndex={i:index.i-1,j:index.j+1};
                    var possibleMove={i:index.i-2,j:index.j+2,eatenCount:1,eatenIndex:eatenIndex};
                    legalMoves.push(possibleMove);
                  }
             }

             if(matrix[index.i-1]!=undefined && matrix[index.i-1][index.j-1]!=undefined && (matrix[index.i-1][index.j-1]==opponentPiece || matrix[index.i-1][index.j-1]==opponentDraughts)){
                  if(matrix[index.i-2]!=undefined && matrix[index.i-2][index.j-2]!=undefined && matrix[index.i-2][index.j-2]==0){
                    var eatenIndex={i:index.i-1,j:index.j-1};
                    var possibleMove={i:index.i-2,j:index.j-2,eatenCount:1,eatenIndex:eatenIndex};
                    legalMoves.push(possibleMove);
                  }
             }

            if(matrix[index.i][index.j]==yourDraughts){

               if(matrix[index.i+1]!=undefined && matrix[index.i+1][index.j+1]!=undefined && (matrix[index.i+1][index.j+1]==opponentPiece || matrix[index.i+1][index.j+1]==opponentDraughts)){
                    if(matrix[index.i+2]!=undefined && matrix[index.i+2][index.j+2]!= undefined && matrix[index.i+2][index.j+2]==0){
                      var eatenIndex={i:index.i+1,j:index.j+1};
                      var possibleMove={i:index.i+2,j:index.j+2,eatenCount:1,eatenIndex:eatenIndex};
                      legalMoves.push(possibleMove);
                    }
                }

                if(matrix[index.i+1]!= undefined && matrix[index.i+1][index.j-1]!=undefined && (matrix[index.i+1][index.j-1]==opponentPiece || matrix[index.i+1][index.j-1]==opponentDraughts)){
                  if(matrix[index.i+2]!=undefined && matrix[index.i+2][index.j-2]!=undefined && matrix[index.i+2][index.j-2]==0){
                    var eatenIndex={i:index.i+1,j:index.j-1};
                    var possibleMove={i:index.i+2,j:index.j-2,eatenCount:1,eatenIndex:eatenIndex};
                    legalMoves.push(possibleMove);
                  }
                }


            }

            return legalMoves;

        }


        function squareClicked(id){
          var idNumber= id.split("myBoard_chess_piece_");
              idNumber=idNumber[1];
              
            if(turn && clicked==true && isIDLegal(idNumber) ){
              
                var squareFrom=pieceIDClicked.split("myBoard_chess_piece_");
                squareFrom=squareFrom[1];
                var squareFromIndex=idConversion(squareFrom);
                squareFrom=indexToPositionString(squareFromIndex);
                var squareToIndex=idConversion(idNumber);
                var squareTo=indexToPositionString(squareToIndex);
                var selectedMove=getMove(idNumber);
                var positionString=squareFrom+"-"+squareTo;

                board.move(positionString);
                

                if(squareToIndex.i==0 || matrix[squareFromIndex.i][squareFromIndex.j]==yourDraughts){
                  
                  matrix[squareFromIndex.i][squareFromIndex.j]=0;
                  matrix[squareToIndex.i][squareToIndex.j]=yourDraughts;
                    
                    highlightDraught(squareToIndex);
                    removeDraught(squareFromIndex);
                      
                    
                  

                }else{
                    
                    matrix[squareFromIndex.i][squareFromIndex.j]=0;
                    matrix[squareToIndex.i][squareToIndex.j]=yourPiece;

                }
                
                var legalMoves=[];
                
                 
                if(selectedMove.eatenCount==0){
                  var opponentMove={positionString:positionString,indexFrom:squareFromIndex,indexTo:squareToIndex,turn:true,eatenCount:0,eatenIndex:""};
                }else{

                  
                  var eatenID=indexConversion(selectedMove.eatenIndex);
                  removeDraught(selectedMove.eatenIndex);
                  matrix[selectedMove.eatenIndex.i][selectedMove.eatenIndex.j]=0;
                  legalMoves=canEatAgain(squareToIndex);
                  var turnToSend=false;
                  if(legalMoves.length!=0){
                    turnToSend=false;
                  }else{
                    turnToSend=true;
                  }
                  var opponentMove={positionString:positionString,indexFrom:squareFromIndex,indexTo:squareToIndex,turn:turnToSend,eatenCount:1,eatenIndex:selectedMove.eatenIndex};
                  newBoardPosition();
                  $('#yourProgress')
                      .progress('increment')
                    ;

                }
 
                
                resetClickAttributes();

                clicked=false;
                if(!gameModeAI){
                socket.emit("multiplayerMove",opponentMove);
                }
                removeHighlightLegalMoves(pieceLegalID);

                if(legalMoves.length!=0 && selectedMove.eatenCount!=0){
                  
                  eatingChain=true;
                  var id="myBoard_chess_piece_"+indexConversion(squareToIndex);
                  pieceClicked(id);



                }else{

                  if(gameModeAI){
                    var data={matrix:matrix,evaluationType:evaluationType,selectedDepth:selectedDepth};
                    socket.emit("AIMove",data);
                  }

                eatingChain=false;
                turn=false;
                turnMessage();
                checkGameStatus();
                

              }
            }
            
        }

        function checkGameStatus(){
          var classNameBlacks="chess_piece chess_piece_pawn chess_player_black";
          var blacks=document.getElementsByClassName(classNameBlacks);
           var classNameWhites="chess_piece chess_piece_pawn chess_player_white";
          var whites=document.getElementsByClassName(classNameWhites);
          if(blacks.length==0 || whites.length==0){
            

            if(blacks.length==0){
              if(color=="black"){
                lostModal();
                socket.emit("won","");
              }else{
                wonModal();
                socket.emit("lost","");
              }
            }

            if(whites.length==0){
              if(color=="white"){
                lostModal();
                socket.emit("won","");
              }else{
                wonModal();
                socket.emit("lost","");
              }

            }


          }else{
            var controlBlack= false;
            var controlWhite= false;
            if(color=="black"){

            for (var i = 0; i < blacks.length; i++) {
              
              var id=blacks[i].getAttribute("id");
              id=id.split("myBoard_chess_piece_");
              id=id[1];
              var index=idConversion(id);
              var movesArray=[];
              movesArray=getLegalMoves(index);
              if(movesArray.length>0){
                controlBlack=true;
                break;
              }

           }

           if(controlBlack==false){
             
              lostModal();
              socket.emit("won","");
             
           }

         }
           if(color=="white"){

           for (var i = 0; i < whites.length; i++) {
              
              var id=whites[i].getAttribute("id");
              id=id.split("myBoard_chess_piece_");
              id=id[1];
              var index=idConversion(id);
              var movesArray=[];
              movesArray=getLegalMoves(index);
              if(movesArray.length>0){
                controlWhite=true;
                break;
              }

           }

           if(controlWhite==false){
            
              lostModal();
              socket.emit("won","");
           
           }

         }

           

           
           
         

          }

        }


        function checkEatingObligation(){
            var className;
            var pieces;
            if(color=="black"){
             className="chess_piece chess_piece_pawn chess_player_black";
             pieces=document.getElementsByClassName(className);
            }else{
             className="chess_piece chess_piece_pawn chess_player_white";
             pieces=document.getElementsByClassName(className);
           }

           for (var i = 0; i < pieces.length; i++) {
                var id=pieces[i].getAttribute("id");
                id=id.split("myBoard_chess_piece_");
                id=id[1];
                var index=idConversion(id);
                var movesArray=[];
                movesArray=canEatAgain(index);
                if(movesArray.length>0){
                  return true;
                }
             
           }

           return false;


        }







        function lostModal(){


          document.getElementById("modalIcon").setAttribute("class","thumbs down icon");
          document.getElementById("bigModalText").innerText="You have been defeated!";
          document.getElementById("smallModalText").innerText="You can continue playing by selecting the game mode";
                $('#gameEndedModal')
                .modal('show')
                ;

          

        }

        function wonModal(){

          document.getElementById("modalIcon").setAttribute("class","thumbs up icon");
          document.getElementById("bigModalText").innerText="You Won!";
          document.getElementById("smallModalText").innerText="You can continue playing by selecting the game mode";
          $('#gameEndedModal')
                .modal('show')
                ;
       


        }



        socket.on("opponentMove",function(response){
            board.move(response.positionString);
            var from=opponentIndexConversion(response.indexFrom);
            var to=opponentIndexConversion(response.indexTo);
            
            if(to.i==7 || matrix[from.i][from.j]==opponentDraughts ){
              matrix[from.i][from.j]=0;
              matrix[to.i][to.j]=opponentDraughts;
              
                highlightDraught(to);
                removeDraught(from);
                  
      
              
              
            }else{

              matrix[from.i][from.j]=0;
              matrix[to.i][to.j]=opponentPiece;
            }

            

            
            if(response.eatenCount==1){
              var opponentIndexConverted=opponentIndexConversion(response.eatenIndex);
              removeDraught(opponentIndexConverted);
              var eatenID=indexConversion(opponentIndexConverted);
              matrix[opponentIndexConverted.i][opponentIndexConverted.j]=0;
              newBoardPosition();
                  $('#opponentProgress')
                      .progress('increment')
                    ;
            }
            
            
            resetClickAttributes();
            removeAllHighlited();
            removeHighlightLegalMoves(pieceLegalID);
            clicked=false;
            turn=response.turn;
            turnMessage();
            checkGameStatus();

            

            

        });

        

        socket.on("AIOpponentMove",function(response){
          setTimeout(function(){
    

          var indexFrom=opponentIndexConversion(response.indexFrom);
          var indexTo=opponentIndexConversion(response.indexTo);
          var positionString=indexToPositionString(indexFrom)+"-"+indexToPositionString(indexTo);
          board.move(positionString);
          if(indexTo.i==7 || matrix[indexFrom.i][indexFrom.j]==opponentDraughts ){
              matrix[indexFrom.i][indexFrom.j]=0;
              matrix[indexTo.i][indexTo.j]=opponentDraughts;
              
                highlightDraught(indexTo);
                removeDraught(indexFrom);
                  
      
              
              
            }else{

              matrix[indexFrom.i][indexFrom.j]=0;
              matrix[indexTo.i][indexTo.j]=opponentPiece;
            }

            if(response.eatenIndexes.length!=0){
              for (var i = 0; i < response.eatenIndexes.length; i++) {
                var opponentIndexConverted=opponentIndexConversion(response.eatenIndexes[i]);
                removeDraught(opponentIndexConverted);
                var eatenID=indexConversion(opponentIndexConverted);
                matrix[opponentIndexConverted.i][opponentIndexConverted.j]=0;
                 newBoardPosition();
                  $('#opponentProgress')
                      .progress('increment')
                    ;
              }
              
                
            }



            resetClickAttributes();
            removeAllHighlited();
            removeHighlightLegalMoves(pieceLegalID);
            clicked=false;
            turn=true;
            turnMessage();
            checkGameStatus();


          }, 1000);
        



        });


        






        socket.on("won",function(response){
          gameModeAI=false;
          wonModal();

        });

        socket.on("lost",function(response){
        gameModeAI=false;
        lostModal();

        });


      




        
        
        
        
        
       
        







