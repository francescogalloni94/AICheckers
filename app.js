var express = require('express');
var path = require('path');
var uuid = require('uuid');
var app = express();
var userMap = {};
var roomMap= {};
var userRoom={};

// Define the port to run on
app.set('port', 8080);

app.use(express.static(path.join(__dirname, 'static')));
var server = require('http').createServer(app);
var io = require('socket.io')(server);
// Listen for requests
server.listen(8080);

io.on('connection', function(socket){ 

 	


 	socket.on('disconnect', function(){

    
    delete userMap[socket.id];

    if(socket.id in userRoom){
    	
    	socket.to(userRoom[socket.id]).emit('opponentDisconnected',"");
    	socket.leave(userRoom[socket.id]);
    	var opponentSocket;
    	var opponentID;
    	if(roomMap[userRoom[socket.id]].player1ID!="" && roomMap[userRoom[socket.id]].player2ID!=""){
    	if(roomMap[userRoom[socket.id]].player1ID==socket.id){
         opponentID=roomMap[userRoom[socket.id]].player2ID;
    	 opponentSocket = io.sockets.connected[opponentID];
    	}else{
    		opponentID=roomMap[userRoom[socket.id]].player1ID;
    		opponentSocket = io.sockets.connected[opponentID];
    	}
         opponentSocket.leave(userRoom[opponentID]);
           delete userRoom[opponentID];
       }
         delete roomMap[userRoom[socket.id]];
         delete userRoom[socket.id];
       

    }
  });

  socket.on("exitGamePlay",function(data){
    
    if(socket.id in userRoom){
      
      socket.to(userRoom[socket.id]).emit('opponentDisconnected',"");
      socket.leave(userRoom[socket.id]);
      var opponentSocket;
      var opponentID;
      if(roomMap[userRoom[socket.id]].player1ID!="" && roomMap[userRoom[socket.id]].player2ID!=""){
      if(roomMap[userRoom[socket.id]].player1ID==socket.id){
         opponentID=roomMap[userRoom[socket.id]].player2ID;
       opponentSocket = io.sockets.connected[opponentID];
      }else{
        opponentID=roomMap[userRoom[socket.id]].player1ID;
        opponentSocket = io.sockets.connected[opponentID];
      }
         opponentSocket.leave(userRoom[opponentID]);
           delete userRoom[opponentID];
       }
         delete roomMap[userRoom[socket.id]];
         delete userRoom[socket.id];
       

    }

  });

 	socket.on('username', function(msg){
 		var control=true;
 	
 		for(key in userMap){
 			if(userMap[key]==msg){
 				control=false;
 			}
 		}
 		if(control){
 			   
 			   userMap[socket.id]=msg;
 			   var response={msg:"UserOk",username:msg};
 			   socket.emit('username',response);
 		}else{
 			
 			socket.emit('username','BadUser');
 		}
 
  });

 	socket.on('multiplayerRequest',function(data){
 		var control= false;
 		for(key in roomMap){
 			
 			if(roomMap[key].playerCount<2){
 				roomMap[key].player2ID= socket.id;
 				roomMap[key].player2Username=userMap[socket.id];
 				roomMap[key].playerCount=2;
 				socket.join(key);
 				userRoom[socket.id]=key;
 				control=true;
 				var gameDataPlayer1 = {opponentUsername: roomMap[key].player2Username, color:"black", image: "vampire.png", opponentImage:"nerd.png", turn:false};
 				var gameDataPlayer2 = {opponentUsername:roomMap[key].player1Username, color:"white", image:"nerd.png",opponentImage:"vampire.png", turn:true};
 				socket.emit("opponentFinded",gameDataPlayer2);
 				socket.to(roomMap[key].player1ID).emit('opponentFinded',gameDataPlayer1);
 				

 			}
 		}
 		if(!control){
 			var roomID=uuid.v1(); 
 			
 			var roomData= { player1ID:socket.id, player1Username: userMap[socket.id], player2ID:"", player2Username:"", playerCount:1};
 			roomMap[roomID]=roomData;
 			socket.join(roomID);
 			userRoom[socket.id]=roomID;


 		}


 	});

    socket.on("multiplayerMove",function(data){
        var room=userRoom[socket.id];
        socket.to(room).emit("opponentMove",data);

    });

    socket.on("won",function(data){
      var room=userRoom[socket.id];
      socket.to(room).emit("won","");
      if(socket.id in userRoom){
      
      
          socket.leave(userRoom[socket.id]);
          var opponentSocket;
          var opponentID;
          if(roomMap[userRoom[socket.id]].player1ID!="" && roomMap[userRoom[socket.id]].player2ID!=""){
          if(roomMap[userRoom[socket.id]].player1ID==socket.id){
             opponentID=roomMap[userRoom[socket.id]].player2ID;
           opponentSocket = io.sockets.connected[opponentID];
          }else{
            opponentID=roomMap[userRoom[socket.id]].player1ID;
            opponentSocket = io.sockets.connected[opponentID];
          }
             opponentSocket.leave(userRoom[opponentID]);
               delete userRoom[opponentID];
           }
             delete roomMap[userRoom[socket.id]];
             delete userRoom[socket.id];
           

     }

    });

    socket.on("lost",function(data){
     var room=userRoom[socket.id];
     socket.to(room).emit("lost","");
     if(socket.id in userRoom){
      
      
          socket.leave(userRoom[socket.id]);
          var opponentSocket;
          var opponentID;
          if(roomMap[userRoom[socket.id]].player1ID!="" && roomMap[userRoom[socket.id]].player2ID!=""){
          if(roomMap[userRoom[socket.id]].player1ID==socket.id){
             opponentID=roomMap[userRoom[socket.id]].player2ID;
           opponentSocket = io.sockets.connected[opponentID];
          }else{
            opponentID=roomMap[userRoom[socket.id]].player1ID;
            opponentSocket = io.sockets.connected[opponentID];
          }
             opponentSocket.leave(userRoom[opponentID]);
               delete userRoom[opponentID];
           }
             delete roomMap[userRoom[socket.id]];
             delete userRoom[socket.id];
           

     }
    });


    socket.on("AIRequest",function(data){
        var gameData={opponentUsername:"AI",color:"white",image:"nerd.png",opponentImage:"avatar.png",turn:true};
        socket.emit("opponentFinded",gameData);

    });



   socket.on("AIMove",function(data){
      
      var node={matrix:data.matrix,type:"max",indexFrom:undefined,indexTo:undefined,eatenIndexes:undefined};
      var evaluatedNode=alphaBetaPruning(node,data.selectedDepth,data.evaluationType);
      socket.emit("AIOpponentMove",evaluatedNode);
      
      


   });





});







function alphaBetaPruning(node,depth,evaluationType){
  var bestAction=null;
  var maxValue=-9999;
  var nodeChilds=getMaxChilds(node);
  for (var i = 0; i < nodeChilds.length; i++) {
    var value=minValue(nodeChilds[i],9999,maxValue,depth-1,evaluationType);
    if(value>maxValue){
      maxValue=value;
      bestAction=nodeChilds[i];
    }
  }
  
  return bestAction;



}





function minValue(node,A,B,depth,evaluationType){
  if(depth==0 || isTerminalState(node.matrix)){
    return evaluate(node.matrix,node.type,evaluationType);
  }
  var value=9999;
  var nodeChilds=getMinChilds(node);
  for (var i = 0; i < nodeChilds.length; i++) {
    value=Math.min(value,maxValue(nodeChilds[i],A,B,depth-1,evaluationType));
    if(value<=A){
       return value;
    }
    B=Math.min(B,value);
  }
  return value;


}








function maxValue(node,A,B,depth,evaluationType){
  if(depth==0 || isTerminalState(node.matrix)){
    return evaluate(node.matrix,node.type,evaluationType);
  }
  var value=-9999;
  var nodeChilds=getMaxChilds(node);
  for (var i = 0; i < nodeChilds.length; i++) {
    value=Math.max(value,minValue(nodeChilds[i],A,B,depth-1,evaluationType));
    if(value>=B){
      return value;
    }
    A=Math.max(A,value);
  }
  return value;
}









function getMaxChilds(node){
  var matrix=rotateMatrix(node.matrix);
  var nodeChilds=[];
  var eatenTrue=checkEatingObligation(matrix,1,2,3,4);
  for (var i = 0; i < matrix.length; i++) {
    for (var j = 0; j < matrix[i].length; j++) {
       if(matrix[i][j]==3 || matrix[i][j]==4){
         var index={i:i,j:j};
         var legalMoves=getLegalMoves(matrix,index,1,2,4);
         var stepIndexes=[];
         for (var y = 0; y < legalMoves.length; y++) {
           var matrixCopy=copyMatrix(matrix);
           var eatenIndexes=[];
           var indexTo={i:legalMoves[y].i,j:legalMoves[y].j};
           var eatControl=false;

           if(legalMoves[y].i==0 || matrixCopy[i][j]==4){
                  
                  matrixCopy[i][j]=0;
                  matrixCopy[legalMoves[y].i][legalMoves[y].j]=4;
            }else{
                    
                    matrixCopy[i][j]=0;
                    matrixCopy[legalMoves[y].i][legalMoves[y].j]=3;

            }

            if(legalMoves[y].eatenCount!=0){
              matrixCopy[legalMoves[y].eatenIndex.i][legalMoves[y].eatenIndex.j]=0;
              eatenIndexes.push(legalMoves[y].eatenIndex);
              eatControl=true;
              
              
            }

            while(eatControl){
            var eatAgain=canEatAgain(matrixCopy,indexTo,1,2,4);
            if(eatAgain.length!=0){

              

              if(eatAgain[0].i==0 || matrixCopy[indexTo.i][indexTo.j]==4){
                matrixCopy[indexTo.i][indexTo.j]=0;
                matrixCopy[eatAgain[0].i][eatAgain[0].j]=4;
              }else{
                matrixCopy[indexTo.i][indexTo.j]=0;
                matrixCopy[eatAgain[0].i][eatAgain[0].j]=3;
              }
              matrixCopy[eatAgain[0].eatenIndex.i][eatAgain[0].eatenIndex.j]=0;

              indexTo.i=eatAgain[0].i;
              indexTo.j=eatAgain[0].j;
              eatenIndexes.push(eatAgain[0].eatenIndex);
              

            }else{
              eatControl=false;
            }
          }

          var childNode={matrix:rotateMatrix(matrixCopy),type:"min",indexFrom:index,indexTo:indexTo,eatenIndexes:eatenIndexes,stepIndexes:stepIndexes};
          if((eatenTrue && childNode.eatenIndexes!=0)|| eatenTrue==false){
          nodeChilds.push(childNode);
         }



         }

       }
      
    }
  }

  return nodeChilds;

}








function getMinChilds(node){
  var nodeChilds=[];
  var eatenTrue=checkEatingObligation(node.matrix,3,4,1,2);
  for (var i = 0; i < node.matrix.length; i++) {
    for (var j = 0; j < node.matrix[i].length; j++) {
      if(node.matrix[i][j]==1 || node.matrix[i][j]==2){
        var index={i:i,j:j};
        var legalMoves=getLegalMoves(node.matrix,index,3,4,2);
        for (var y = 0; y < legalMoves.length; y++) {
          var matrixCopy=copyMatrix(node.matrix);
          var eatenIndexes=[];
          var indexTo={i:legalMoves[y].i,j:legalMoves[y].j};
          var eatControl=false;
          if(legalMoves[y].i==0 || matrixCopy[i][j]==2){
                  
                  matrixCopy[i][j]=0;
                  matrixCopy[legalMoves[y].i][legalMoves[y].j]=2;
          }else{
                    
                    matrixCopy[i][j]=0;
                    matrixCopy[legalMoves[y].i][legalMoves[y].j]=1;

          }

          if(legalMoves[y].eatenCount!=0){
              matrixCopy[legalMoves[y].eatenIndex.i][legalMoves[y].eatenIndex.j]=0;
              eatenIndexes.push(legalMoves[y].eatenIndex);
              eatControl=true;
              
              
          }

          while(eatControl){
            var eatAgain=canEatAgain(matrixCopy,indexTo,3,4,2);
            if(eatAgain.length!=0){

              if(eatAgain[0].i==0 || matrixCopy[indexTo.i][indexTo.j]==2){
                matrixCopy[indexTo.i][indexTo.j]=0;
                matrixCopy[eatAgain[0].i][eatAgain[0].j]=2;
              }else{
                matrixCopy[indexTo.i][indexTo.j]=0;
                matrixCopy[eatAgain[0].i][eatAgain[0].j]=1;
              }
              matrixCopy[eatAgain[0].eatenIndex.i][eatAgain[0].eatenIndex.j]=0;

              indexTo.i=eatAgain[0].i;
              indexTo.j=eatAgain[0].j;
              eatenIndexes.push(eatAgain[0].eatenIndex);


            }else{
              eatControl=false;
            }
          }

         var childNode={matrix:matrixCopy,type:"max",indexFrom:index,indexTo:indexTo,eatenIndexes:eatenIndexes};
         if((eatenTrue && childNode.eatenIndexes!=0)|| eatenTrue==false){
         nodeChilds.push(childNode);
        }

        }
       
      }


    }
  }
  return nodeChilds;

}








function evaluate(matrix,type,evaluationType){
  if(evaluationType=="Pieces"){
    return evaluatePieces(matrix,type);
  }else if(evaluationType=="BoardPosition"){
    return evaluateBoardPosition(matrix,type);
  }else if(evaluationType=="BoardPositionNormalized"){
    return evaluateBoardPositionNormalized(matrix,type);
  }else if(evaluationType=="RowPosition"){
    return evaluateRowPosition(matrix,type);
  }
}








function evaluatePieces(matrix,type){
   
   var userPieces=0;
   var userDraughts=0;
   var AIPieces=0;
   var AIDraughts=0;

   for (var i = 0; i < matrix.length; i++) {
     for (var j = 0; j < matrix[i].length; j++) {
       if(matrix[i][j]==1){
        userPieces++;
       }

       if(matrix[i][j]==2){
        userDraughts++;
       }

       if(matrix[i][j]==3){
        AIPieces++;
       }

       if(matrix[i][j]==4){
        AIDraughts++;
       }


     }
   }

   if(type=="max"){
     var evaluation=-(userPieces+2*(userDraughts))+(AIPieces+2*(AIDraughts));
     return evaluation;
   }

   if(type=="min"){
    var evaluation=(AIPieces+2*(AIDraughts))-(userPieces+2*(userDraughts));
    return evaluation;
   }

}







function evaluateBoardPosition(matrix,type){
  
  var userPieces=0;
  var userDraughts=0;
  var AIPieces=0;
  var AIDraughts=0;

  for (var i = 0; i < matrix.length; i++) {
     for (var j = 0; j < matrix[i].length; j++) {
       if(matrix[i][j]==1){
         if(0<=i<=3){
          userPieces+=7;
         }else{
          userPieces+=5;
         }
       }

       if(matrix[i][j]==2){
        userDraughts+=10;
       }

       if(matrix[i][j]==3){
          if(4<=i<=7){
            AIPieces+=7;
         }else{
            AIPieces+=5;
         }
       }

       if(matrix[i][j]==4){
        AIDraughts+=10;
       }


     }
   }

   if(type=="max"){
     var evaluation=-(userPieces+userDraughts)+(AIPieces+AIDraughts);
     return evaluation;
   }

   if(type=="min"){
    var evaluation=(AIPieces+AIDraughts)-(userPieces+userDraughts);
    return evaluation;
   }

}






function evaluateBoardPositionNormalized(matrix,type){
  
  var userPieces=0;
  var userDraughts=0;
  var AIPieces=0;
  var AIDraughts=0;
  var piecesCount=0;

  for (var i = 0; i < matrix.length; i++) {
     for (var j = 0; j < matrix[i].length; j++) {
       if(matrix[i][j]==1){
         if(0<=i<=3){
          userPieces+=7;
          piecesCount++;
         }else{
          userPieces+=5;
          piecesCount++;
         }
       }

       if(matrix[i][j]==2){
        userDraughts+=10;
        piecesCount++;
       }

       if(matrix[i][j]==3){
          if(4<=i<=7){
            AIPieces+=7;
            piecesCount++;
         }else{
            AIPieces+=5;
            piecesCount++;
         }
       }

       if(matrix[i][j]==4){
        AIDraughts+=10;
        piecesCount++;
       }


     }
   }

   if(type=="max"){
     var evaluation=(-(userPieces+userDraughts)+(AIPieces+AIDraughts))/piecesCount;
     return evaluation;
   }

   if(type=="min"){
    var evaluation=((AIPieces+AIDraughts)-(userPieces+userDraughts))/piecesCount;
    return evaluation;
   }


}






function evaluateRowPosition(matrix,type){
  
  var userPieces=0;
  var userDraughts=0;
  var AIPieces=0;
  var AIDraughts=0;
  


  for (var i = 0; i < matrix.length; i++) {
     for (var j = 0; j < matrix[i].length; j++) {
       if(matrix[i][j]==3){
            AIPieces+=(5+(i+1));
       }

       if(matrix[i][j]==4){
        AIDraughts+=(7+(i+1));
        
       }


     }
   }

   var newMatrix=rotateMatrix(matrix);
   for (var i = 0; i < newMatrix.length; i++) {
     for (var j = 0; j < newMatrix[i].length; j++) {
       if(newMatrix[i][j]==1){
            userPieces+=(5+(i+1));
       }

       if(newMatrix[i][j]==2){
            userDraughts+=(7+(i+1));
       }
     }
   }

   if(type=="max"){
     var evaluation=-(userPieces+userDraughts)+(AIPieces+AIDraughts);
     return evaluation;
   }

   if(type=="min"){
    var evaluation=(AIPieces+AIDraughts)-(userPieces+userDraughts);
    return evaluation;
   }


}






function isTerminalState(matrix){
  var userPiecesCounter=0;
  var AIPiecesCounter=0;
  var userMovesCounter=0;
  var AIMovesCounter=0;
  

    for (var i = 0; i < matrix.length; i++) {
    for (var j = 0; j < matrix[i].length; j++) {
      if(matrix[i][j]==1 || matrix[i][j]==2){
        userPiecesCounter++;
        var index={i:i,j:j};
        var legalMoves=getLegalMoves(matrix,index,3,4,2);
        if(legalMoves.length!=0){
          userMovesCounter++;
        }
      }
    }
   }
   var newMatrix=rotateMatrix(matrix);
   for (var i = 0; i < newMatrix.length; i++) {
    for (var j = 0; j < newMatrix[i].length; j++) {
      if(newMatrix[i][j]==3 || newMatrix[i][j]==4){
        AIPiecesCounter++;
        var index={i:i,j:j};
        var legalMoves=getLegalMoves(newMatrix,index,1,2,4);
        if(legalMoves.length!=0){
          AIMovesCounter++;
        }
      }
    }
   }

  
   if(userPiecesCounter==0 || AIPiecesCounter==0){
     return true;
   }else if (userMovesCounter==0 || AIMovesCounter==0) {
     return true;
   }else{
    return false;
   }

}






function getWinner(matrix){
  var userPiecesCounter=0;
  var AIPiecesCounter=0;
  var userMovesCounter=0;
  var AIMovesCounter=0;
 

    for (var i = 0; i < matrix.length; i++) {
    for (var j = 0; j < matrix[i].length; j++) {
      if(matrix[i][j]==1 || matrix[i][j]==2){
        userPiecesCounter++;
        var index={i:i,j:j};
        var legalMoves=getLegalMoves(matrix,index,3,4,2);
        if(legalMoves.length!=0){
          userMovesCounter++;
        }
      }
    }
   }
   var newMatrix=rotateMatrix(matrix);
   for (var i = 0; i < newMatrix.length; i++) {
    for (var j = 0; j < newMatrix[i].length; j++) {
      if(newMatrix[i][j]==3 || newMatrix[i][j]==4){
        AIPiecesCounter++;
        var index={i:i,j:j};
        var legalMoves=getLegalMoves(newMatrix,index,1,2,4);
        if(legalMoves.length!=0){
          AIMovesCounter++;
        }
      }
    }
   }

  
   if(userPiecesCounter==0 || userMovesCounter==0){
     return "AI";
   }else if (AIPiecesCounter==0 || AIMovesCounter==0) {
     return "User";
   }
}







function getLegalMoves(matrix,index,opponentPiece,opponentDraughts,yourDraughts){
             var legalMoves=[];
             var eatenLegalMoves=[];
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









         function canEatAgain(matrix,index,opponentPiece,opponentDraughts,yourDraughts){
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




  function checkEatingObligation(matrix,opponentPiece,opponentDraughts,yourPiece,yourDraughts){
    for (var i = 0; i < matrix.length; i++) {
      for (var j = 0; j < matrix[i].length; j++) {
         if((matrix[i][j]==yourPiece) || (matrix[i][j]==yourDraughts)){
          var index={i:i,j:j};
          var movesArray=[];
          movesArray=canEatAgain(matrix,index,opponentPiece,opponentDraughts,yourDraughts);
          if(movesArray.length>0){
            return true;
          }
             
         }

      }
    }
    return false;
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






function initializeMatrix(matrix){
  for (var i = 0; i < 8; i++) {
                matrix[i]=[];
      for(var j=0; j<8; j++){
                matrix[i][j]=0;
      }
  }
  return matrix;
}






function copyMatrix(matrix){
  var newMatrix=[];
  for (var i = 0; i < matrix.length; i++) {
    newMatrix[i]=[];
    for (var j = 0; j <matrix[i].length; j++) {
      
      newMatrix[i][j]=matrix[i][j];
    }
  }
  return newMatrix;
}















