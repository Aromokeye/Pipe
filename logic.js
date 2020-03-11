const electron = require('electron')
var _ = require('lodash');
const {ipcRenderer}= electron



//event to collect input data
var pipes=[]
//create local storage for outgoing loops for rendering
function getLoopMessage(){
    let loopMessage
    if(localStorage.getItem('loops')=== null){
        loopMessage = []
    }else{
        loopMessage = JSON.parse(localStorage.getItem('loops'))
    }
    return loopMessage
}
function addLoopMessage(loop){
    let loopMessage = getLoopMessage()
    loopMessage.push(loop)
    localStorage.setItem('loops', JSON.stringify(loopMessage))
}
 //check and assign Q1 as Qo for reoccuring pipe in next loop
 function updateLoopMessage(){
    let value = getLoopMessage()
   if (value.length === 2 && _.isEqual(value[0].pipes[2].pipeName, value[1].pipes[2].pipeName)){
       // q
    value[1].pipes[2].q = value[0].pipes[2].q1 * -1
    //hf redo
    value[1].pipes[2].hf= value[1].pipes[2].r * value[1].pipes[2].q * Math.abs(value[1].pipes[2].q)
    //2RQ redo
    value[1].pipes[2].rq = 2 * value[1].pipes[2].r * Math.abs(value[1].pipes[2].q)
    //sum of hfs
       let a = value[1].pipes.reduce((acc, num) =>{
        return acc + num.hf}, 0)
        //sum of hqs
       let b= value[1].pipes.reduce((acc, num) => {
            return acc + num.rq}, 0)
            //value of dq per pipe
        value[1].pipes.forEach(pipe=>{
            return pipe.dq = (a * -1)/b})
           //value of q1 per pipe 
        value[1].pipes.forEach(pipe=>{
            return pipe.q1 = pipe.q + pipe.dq})

   localStorage.setItem('loops', JSON.stringify(value))
    }
}

var pipeName
var flowRate
var diameter
var length
var number= document.querySelector('#number').innerHTML = 0


var form = document.querySelector('form')
    form.addEventListener('submit', submitForm)

function submitForm(e){
    e.preventDefault()

    //create loop container
   

    //collect pipe information 
   
        pipeName=document.querySelector('#pipename').value 
        flowRate=document.querySelector('#flowrate').value
        diameter=document.querySelector('#diameter').value
        length=document.querySelector('#length').value
       

    //calculate diameter from inch to meter
    const diameterMeter=(diameter)=>{
        return (diameter*0.0254).toFixed(4)
    } 

    const dm=diameterMeter(diameter)
    
    //calculate length from mile to meter
    const lengthMeter=(length)=>{
        return (length * 1609).toFixed(0)
    }

    const lm=lengthMeter(length)

    //calculate Reynold NUmber
    const getReynold=(flowRate, diameter)=>{
        let calc= (20 * flowRate * 0.67) / (0.03317 * diameter)
        return calc.toFixed(0)
    }

    //prepare Reynold Number
    getReynold(flowRate, diameter)

    //calculate TestF
    const getTestF=()=>{
        let f= 0.0056 + 0.5 * ((getReynold(flowRate, diameter)) ** -0.32)
        return f
    }
    const f= getTestF()

    //get Colebrook value first
    const doColebrook=(f, flowRate, diameter)=>{
        let a= 1/(1.74 - 2 * Math.log10((2*(0.000183/dm)) + 
        (2.15/((getReynold(flowRate, diameter)) * Math.sqrt(f)))))
        return  Math.pow(a, 2)
    }

    const fakeF= doColebrook(f, flowRate, diameter)

    //iterate over colebrook to get fReal
    function getRealF(){
        if (fakeF !== f){
            f == fakeF
            doColebrook(fakeF)
        }
        return fakeF.toFixed(5)
    }

    const frictionFactor= fakeF

    //calculate r
    function doR(frictionFactor, dm, lm){
        let rguy= (32 * frictionFactor * lm )/(9.8 * Math.pow(3.142, 2) * Math.pow(dm, 5))
        return Math.round(rguy)
    }

    const rCollect= doR(frictionFactor, dm, lm)

    //calculate Q
    function doQ(flowRate){
        const direction = document.querySelector('#customCheck1')
        if(direction.checked){
            return flowRate * 0.00032755 * -1
        }else{
            return flowRate * 0.00032755
        }
       
    }

    const qCollect = doQ(flowRate)

    function doHf(){
        return rCollect * qCollect * Math.abs(qCollect)
    }

    function doRq(){
        return 2 * rCollect * Math.abs(qCollect)
    }
    


    const pipe ={ 
            pipeName: pipeName,
            length: lengthMeter(length),
            diameter: diameterMeter(diameter),
            reynoldNumber: getReynold(flowRate, diameter),
            fReal: getRealF(),
            r: doR(frictionFactor, dm, lm),
            q: doQ(flowRate),
            hf: doHf(),
            rq: doRq(),
            
        }
    
    pipes.push(pipe)
      number=document.querySelector('#number').innerHTML = number + 1
       form.reset()
       
}

//populate loop object with pipes recieved and work on it
let collate = document.querySelector('#collate')
collate.addEventListener('click', doCollate)
function doCollate(e){
    e.preventDefault()


    let loop = {
        pipes:  pipes,

        sumOfHfs: function(){
            const sumOfHfs = this.pipes.reduce((acc, num) =>{
                return acc + num.hf
                }, 0)
                return sumOfHfs
        },

        sumOfRqs: function(){
            const sumOfRqs = this.pipes.reduce((acc, num) => {
                return acc + num.rq
                }, 0)
                return sumOfRqs
        },

        dq: function(){
           let result= this.pipes.forEach(pipe=>{
                return pipe.dq = (this.sumOfHfs() * -1)/this.sumOfRqs()
            })
            return result
        },

        q1: function(){
            let result =this.pipes.forEach(pipe=>{
               return pipe.q1 = pipe.q + pipe.dq
            })
            return result
        }

    }

    //initialize the derived pipe values and push to parent array
    loop.sumOfHfs()
    loop.sumOfRqs()
    loop.dq()
    loop.q1()
    addLoopMessage(loop)
    updateLoopMessage()

}   

//send Loops to main.js
const render = document.querySelector('#render')
render.addEventListener('click', showLoop)

function showLoop(e){
    e.preventDefault()
    let container = _.cloneDeep(getLoopMessage())
    return ipcRenderer.send('torender', container)
    
}
    