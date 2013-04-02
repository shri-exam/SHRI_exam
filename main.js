$(function() {

var dfd = $.Deferred();
var x;
var photo_arr =[];
var next_selection;
var added_arr =[];
dfd.resolve();

dfd

.pipe(function(){                           //работа с Яндекс.Фотки Api получение сервисного документа
    return $.ajax({                         //для получения ссылки к альбомам
        type: "GET",
        url: "http://api-fotki.yandex.ru/api/users/aig1001/?format=json&callback=?",
        dataType: "json",
        success: function(data){
        x = $(data.collections["album-list"]).attr("href");
        }});
})

.pipe(function(){                           //работа с Яндекс.Фотки Api получение альбомов пользователя
    return $.ajax({                         //для выбора необходимого альбома и выборки из него ссылок
        type: "GET",                        // на фотографии
        url: x + "?format=json&callback=?",
        dataType: "json",
        success: function(data){
            var n =0;
            while (data.entries[n].title !== "Кошкин дом")n++;
            x = data.entries[n].links.photos;
        }
    });
})

.pipe(function(){                         //работа с Яндекс.Фотки Api получение ссылок на фотографии
       return $.ajax({                    //сортируем данные на размеры L и S
            type: "GET",                  //сохраняется ссылка на следующую страницу выдачи
            url: x + "&callback=?",
            dataType: "json",
            success: function(data){
                for(var n = 0;n<(data.entries.length);n++){
                  photo_arr.push($(data.entries[n]["img"]["L"]).attr("href"));
                  photo_arr.push($(data.entries[n]["img"]["S"]).attr("href"));
                }
                next_selection = (data["links"]["next"]);
    }

        })
})

.pipe(function(){

        for(var n=1;n < photo_arr.length/2;n+=2){              //заполняем панель выбора фото из массива
            $("ul").append("<li><img src="+photo_arr[n]+" data-number="+[n]+"></li>")
        }

        var scroll_H = $("div.scroll").height();               //анимируем скрытие панели выбора фото
        $("div.scroll").css({"bottom":-scroll_H,"paddingTop":scroll_H})
                       .mouseenter(function(){
                            $(this).animate({"bottom":0,"paddingTop":0})
                       })
                       .mouseleave(function(){
                            $(this).animate({"bottom":-scroll_H,"paddingTop":scroll_H})
                       });


        $("ul").on("scrolling", function moveObject(event){        //отлавливаем событие скрола на панели выбора фото
                    this.addEventListener('DOMMouseScroll', moveObject, false);
                    this.onmousewheel = moveObject;

                var delta = 0;
                delta = event.detail/-3 || event.wheelDelta/120;

                var currPos=$(this).position().left;
                currPos=parseInt(currPos)-(delta*50);

                ($(this).position().left >=0 && delta<0)?currPos=0 : $(this).offset({left:currPos}); //запрет скролла в "пустой сектор
        });

        $("ul").trigger("scrolling");

})

.pipe(function(){

        var first_num;                             //загружаем первое фото в панели просмотра
        var first_src;
        if (localStorage.length > 0){
            first_num = localStorage.getItem('main_num');
            first_src = localStorage.getItem('main_src');
        }else{
            first_num =0;
            first_src =photo_arr[0];
        }
        $("div.show span").append("<img src=" + first_src + " data-number=" + first_num + ">");


        $("div.arrowr , div.arrowl").show();       //анимируем перелистывание фото по клику на стрелки
        $(document).mouseenter(function(){
            $("div.arrowr , div.arrowl").fadeIn("normal");
        })
            .mouseleave(function(){
                $("div.arrowr , div.arrowl").fadeOut("normal");
            });


        var winSize_W = $(window).width();
        var winSize_H = $(window).height();

       function navigate(navDirect,num1){

           var dfd2 = $.Deferred();                    //анимируем перелистывание фото
            dfd2.resolve();
            dfd2
                .pipe(function(){
                    $("div.show span > img:eq(0)").animate({"left":winSize_W*navDirect})
                })
                .pipe(function(){
                    $("div.show span").append("<img src=" + photo_arr[num1-1] + " data-number=" + [num1-1] + ">");
                    $("div.show span > img:eq(1)").css({"left":-winSize_W*navDirect})
                                             .animate({"left":"0px"},function(){$("div.show  span> img:eq(0)").remove()})
                    localStorage.setItem('main_src', photo_arr[num1-1]);   //сохраняем текущие значение фото
                    localStorage.setItem('main_num', num1-1);

                });
            dfd2.done();



          var active_elem = ($('li img[data-number=' + num1 + ']'));         //центрируем активное фото на панели выбора
          var change =parseInt(active_elem.offset().left) - parseInt(winSize_W/2) + parseInt(active_elem.width()/2);

          if($("li img[ data-number = '1']").offset().left - change >0){
               (change > 0)?change = 0:change = $("li img[ data-number = '1']").offset().left;
             }
          $("ul").animate({"left":'-='+change});


          if($(active_elem).attr("data-number")>= photo_arr.length-20 ){      // догружаем фото со следующей страницы выдачи
                add_next_selection();
          }


           $("li img").css({"borderColor":"transparent"});                    //выделяем активное фото на панели выбора
           active_elem.css({"borderColor":"#3d94ff"});
       }

        $("li img").click(function(){                                         //выбираем фото по клику на панели выбора фото
        var navDirect;
        var num1 = parseInt($(this).attr("data-number"));
            var num0 = parseInt($("div.show span > img:eq(0)").attr("data-number"));
            (num1>num0)?navDirect=-1:navDirect=1;

            navigate(navDirect,num1);

        });

        $("div.arrowr").click(function(){                                      //выбираем фото по клику на стрелки
           var this_img = $("div.show span >img:eq(0)").attr("data-number");
           var num1=parseInt(this_img)+3;
            navigate(-1,num1)
        });

        $("div.arrowl").click(function(){
            var num1 = parseInt($("div.show span >img:eq(0)").attr("data-number"))-1;
            if(num1<0)num1=1;
            navigate(1,num1)

        }) ;

        function add_next_selection(){                           //работа с Яндекс.Фотки Api получение ссылок на фотографии
            return $.ajax({                                     //получение ссылок на фотографии со следующей страницы выдачи
                type: "GET",                                    // и их догрузка в панель выбора фото
                url: next_selection + "&callback=?",
                dataType: "json",
                success: function(data){
                    for(var n = 0;n<(data.entries.length);n++){
                        added_arr.push($(data.entries[n]["img"]["L"]).attr("href"));
                        added_arr.push($(data.entries[n]["img"]["S"]).attr("href"));
                    }
                    next_selection = (data["links"]["next"]);
                    $.merge( photo_arr, added_arr );
                    added_arr = [];
                    var next_first = photo_arr.length - data.entries.length*2;
                    for(var i = next_first+1;i<(photo_arr.length);i+=2){

                    $("ul").append("<li><img src="+photo_arr[i]+" data-number="+ i +"></li>");
                 }}
             })
        }

});



dfd.done();

});

