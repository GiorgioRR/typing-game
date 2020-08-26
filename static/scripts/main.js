
function save_data (score_v) {
    var user_n  = document.getElementById("user-n").value;
    var email_n = document.getElementById("email-n").value;
    socket.emit( 'score', {
        username: user_n,
        email: email_n,
        score: score_v
    })
    socket.on( 'invalid-usr', function (msg) {
        document.getElementById("invalid").textContent  = "invalid";
    })
    socket.on( 'redirect', function (data) {
        window.location = data.url;
    })
}


function done () {
    if (done_b === false){
        var score_v = document.getElementById("score").textContent.split(" ")[1];
        var html =
        `<div class="save">
            <h2 class="margin">Do you want to save your score? (${score_v})</h2>
    
            <h2 class="margin">UserName:</h2>
            <input class="margin" id="user-n" type="text">
    
            <h2 id="invalid"></h2>
    
            <h2 class="margin">Email:</h2>
            <input class="margin" id="email-n" type="text">
    
            <a><button class="save-b" onclick=save_data(${score_v})>save</button></a>
        </div>`;
        document.getElementById("body").innerHTML += html;  // document.write(html);
        done_b = true;
    }
}


function check_elements () {
    if (document.getElementById("body").scrollHeight < window.innerHeight) {
        socket.emit("done", {something: "something"});
        done();
    }
}


function next_step (new_text, class_n) {
    for (i = 0; i < elements.length; i++) {
        var ell = elements[i][0];
        var d = document.getElementById(ell);
        d.style.left = (parseInt(d.style.left.replace("px", ""))+22)+"px";
    }

    word_list.push(new_text);  // console.log(text, word_list);
    elements.push([`t${class_n}`, new_text]);
}


function check (text) {
    if (word_list.includes(text)) {
        // const index = word_list.indexOf(text);
        // word_list.splice(index, 1);

        document.getElementById("input").style.color = "black";
        document.getElementById("input").value = "";
        for (i = 0; i < elements.length; i++) {
            if ( elements[i][1] == text) {
                document.getElementById(elements[i][0]).remove();
                elements.splice(i, 1)
                word_list.splice(i, 1);
                break;
            }
        }  // ეკრანიდან ვაქრობთ მაგ რაღაცას
        var score = document.getElementById("score");
        var current = parseInt(score.textContent.split(" ")[1]);
        
        score.textContent = "score: " + (current + 1);

    }
    else {
        document.getElementById("input").style.color = "red";
    }
}


function append_message (text, top_num, class_n) {
    var element = 
    `<h2 style="
    position: absolute;
    top: ${top_num}%;
    left: 3px;" id="t${class_n}">${text}</h2>
    `;

    document.getElementById("elements").innerHTML += element;  // ეკრანზე ვამატებთ რანდომ წერტილზე done
    next_step(text, class_n);                                  // ყველაფერი გადაგვაქ ოდნავ წინ
    check_elements();                                          // ასევე ვამოწმებთ რომელიმე ხომ არ გასცდა მაქსიმუმს
}


function main () {
    var time  = document.getElementById("time");
    var entry = document.getElementById("input");

    socket.on( 'connect', function() {
        socket.emit( 'joined', {
            data: 'User Connected'
        })
    })

    socket.emit( 'time', {something: "0"});
    socket.on( 'time', function( msg ) {
        time.textContent = msg.time;
    })

    socket.on( 'word', function( msg ) {
        append_message(
            msg.w.replace("↵", '').replace('\n', '').replace('"', ''),
            msg.num,
            msg.class_n);  // (msg.w);
    })

    entry.addEventListener("keypress", function (e) {
        if (e.keyCode == 13) {
            check(entry.value);
        }
    }
    );
}


var domain = `http://${document.domain}:${location.port}`;
var socket = io.connect(domain);

var done_b = false;

var word_list = [];
var elements  = [];  // elements.push([class_name, text])

main();
