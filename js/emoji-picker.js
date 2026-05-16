// Emoji picker partagé (chat, commentaires, etc.)
// Fournit : catalogue complet, recherche FR/EN, onglets de catégories, bouton "+" pour réactions.
// Aucune dépendance — chargé avant chat.js / comments.js.

const EMOJI_CATEGORIES = {
  'Smileys': [
    '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','🫠','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🫣','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😶‍🌫️','😏','😒','🙄','😬','😮‍💨','🤥','🫨','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','😵‍💫','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','☹️','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾'
  ],
  'Gestes & Personnes': [
    '👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','🫷','🫸','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','🫦','💋','🩸',
    '👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🫅','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🫃','🫄','🤱','👼','🎅','🤶','🧙','🧚','🧛','🧜','🧝','🧞','🧟','🧌','💆','💇','🚶','🧍','🧎','🏃','💃','🕺','🕴️','👯','🧖','🧗','🤺','🏇','⛷️','🏂','🏌️','🏄','🚣','🏊','⛹️','🏋️','🚴','🚵','🤸','🤼','🤽','🤾','🤹','🧘','🛀','🛌','👭','👫','👬','💏','💑','👪','🗣️','👤','👥','🫂'
  ],
  'Cœurs & Symboles': [
    '❤️','🩷','🧡','💛','💚','💙','🩵','💜','🖤','🩶','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💖','💗','💓','💞','💕','💟','❣️','💌','💋','💘','💝','💯','💢','💥','💫','💦','💨','🕳️','💬','👁️‍🗨️','🗨️','🗯️','💭','💤','✨','🌟','⭐','🌠','☄️','🔥','💧','🌊'
  ],
  'Animaux & Nature': [
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🕸️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔',
    '🌵','🎄','🌲','🌳','🌴','🪵','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🍄','🐚','🪨','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐','🌟','✨','⚡','☄️','💥','🔥','🌪️','🌈','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','💧','💦','☔','☂️','🌊','🌫️'
  ],
  'Nourriture & Boisson': [
    '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🫘','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🫙','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🫛','🍯','🥛','🫗','🍼','🫖','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽️','🥣','🥡','🥢','🧂'
  ],
  'Activités & Sport': [
    '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🪈','🎲','♟️','🎯','🎳','🎮','🎰','🧩'
  ],
  'Voyage & Lieux': [
    '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🦯','🦽','🦼','🩼','🛴','🚲','🛵','🏍️','🛺','🛞','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','🪝','⛽','🚧','🚦','🚥','🚏','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🛖','🏠','🏡','🏘️','🏚️','🏗️','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🕍','🛕','🕋','⛩️','🛤️','🛣️','🗾','🎑','🏞️','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙️','🌃','🌌','🌉','🌁'
  ],
  'Objets': [
    '⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🪤','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','🩻','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪥','🪒','🧽','🪣','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🛌','🧸','🪆','🖼️','🪞','🪟','🛍️','🛒','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️','🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'
  ],
  'Symboles': [
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','👁️‍🗨️','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛','🕜','🕝','🕞','🕟','🕠','🕡','🕢','🕣','🕤','🕥','🕦','🕧'
  ],
  'Drapeaux': [
    '🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇫🇷','🇧🇪','🇨🇭','🇨🇦','🇺🇸','🇬🇧','🇮🇪','🇪🇸','🇵🇹','🇮🇹','🇩🇪','🇳🇱','🇱🇺','🇦🇹','🇩🇰','🇸🇪','🇳🇴','🇫🇮','🇮🇸','🇵🇱','🇨🇿','🇸🇰','🇭🇺','🇷🇴','🇧🇬','🇬🇷','🇹🇷','🇷🇺','🇺🇦','🇧🇾','🇪🇪','🇱🇻','🇱🇹','🇯🇵','🇰🇷','🇰🇵','🇨🇳','🇹🇼','🇭🇰','🇲🇴','🇸🇬','🇲🇾','🇮🇩','🇹🇭','🇻🇳','🇵🇭','🇮🇳','🇵🇰','🇧🇩','🇱🇰','🇳🇵','🇦🇫','🇮🇷','🇮🇶','🇮🇱','🇵🇸','🇸🇦','🇦🇪','🇶🇦','🇰🇼','🇧🇭','🇴🇲','🇾🇪','🇯🇴','🇱🇧','🇸🇾','🇪🇬','🇲🇦','🇩🇿','🇹🇳','🇱🇾','🇸🇩','🇪🇹','🇰🇪','🇹🇿','🇳🇬','🇬🇭','🇸🇳','🇨🇮','🇨🇲','🇿🇦','🇲🇽','🇧🇷','🇦🇷','🇨🇱','🇵🇪','🇨🇴','🇻🇪','🇺🇾','🇵🇾','🇧🇴','🇪🇨','🇨🇺','🇩🇴','🇭🇹','🇯🇲','🇹🇹','🇦🇺','🇳🇿','🇫🇯','🇵🇬'
  ]
};

const EMOJI_CATEGORY_ICONS = {
  'Smileys': '😀',
  'Gestes & Personnes': '👋',
  'Cœurs & Symboles': '❤️',
  'Animaux & Nature': '🐶',
  'Nourriture & Boisson': '🍕',
  'Activités & Sport': '⚽',
  'Voyage & Lieux': '✈️',
  'Objets': '💡',
  'Symboles': '🔣',
  'Drapeaux': '🏁'
};

const EMOJI_KEYWORDS = {
  '😀':'sourire smile rire happy heureux','😃':'sourire smile happy','😄':'sourire smile happy joie',
  '😁':'sourire grin','😆':'rire laugh','😅':'rire sueur sweat','🤣':'mdr rire roll lol',
  '😂':'rire pleur laugh tears lol','🙂':'sourire smile','🙃':'envers upside down',
  '😉':'clin oeil wink','😊':'sourire content blush','😇':'ange angel','🥰':'amoureux love',
  '😍':'amoureux love coeur heart','🤩':'star wow etoile','😘':'bisou kiss',
  '😗':'bisou kiss','😚':'bisou kiss','😙':'bisou kiss','🥲':'larme heureux',
  '😋':'miam delicious yum','😛':'langue tongue','😜':'langue wink tongue',
  '🤪':'fou crazy zany','😝':'langue tongue','🤑':'argent money','🤗':'calin hug',
  '🤔':'reflexion pense think','🫡':'salut salute','😐':'neutre neutral',
  '😑':'expressionless','🙄':'yeux roll','😏':'sourire malice smirk',
  '😒':'blase unamused','😬':'grimace','😮‍💨':'soupir relief','🥱':'baille yawn',
  '😪':'fatigue sleepy','😴':'dort sleep dormir','🤤':'bave drool',
  '🥵':'chaud hot','🥶':'froid cold','😵':'etourdi dizzy','🤯':'explose mind blown',
  '🥳':'fete party','🥸':'deguisement disguise','😎':'cool sunglasses lunettes',
  '🤓':'nerd geek','🧐':'monocle','🥺':'implore puppy pleading','😟':'inquiet worried',
  '😢':'triste larme sad cry','😭':'pleure cry sad','😱':'cri scream peur',
  '😨':'peur fear','😰':'sueur anxious','😡':'colere angry','🤬':'jure swear',
  '😈':'diable devil','👿':'diable imp','💀':'mort skull crane','☠️':'mort skull pirate',
  '💩':'caca poop','🤡':'clown','👻':'fantome ghost','👽':'alien extraterrestre',
  '🤖':'robot bot','🎃':'citrouille pumpkin halloween','😺':'chat cat',
  '👋':'salut hello wave bonjour','🤚':'main stop hand','✋':'main hand stop',
  '🖖':'vulcan spock','🤏':'pincee pinch','✌️':'paix peace victoire','🤞':'doigts croises fingers crossed',
  '🤟':'love rock','🤘':'rock metal','🤙':'call cool','👈':'gauche left',
  '👉':'droite right','👆':'haut up','👇':'bas down','☝️':'index up',
  '👍':'pouce ok bien good thumbs up','👎':'pouce mal bad thumbs down','✊':'poing fist','👊':'poing punch',
  '🤛':'poing gauche left','🤜':'poing droite right','👏':'applaudir bravo clap',
  '🙌':'mains haut praise','🫶':'coeur mains hands heart','👐':'mains open hands',
  '🤲':'paume palms','🤝':'poignee handshake deal','🙏':'priere pray merci thanks please',
  '💪':'muscle bras force strong','🦾':'bionique','👀':'yeux eyes','👁️':'oeil eye',
  '👄':'bouche mouth','💋':'bisou kiss mark',
  '❤️':'coeur amour love rouge red heart','🧡':'coeur orange','💛':'coeur jaune yellow',
  '💚':'coeur vert green','💙':'coeur bleu blue','💜':'coeur violet purple',
  '🖤':'coeur noir black','🤍':'coeur blanc white','💔':'coeur brise broken',
  '❤️‍🔥':'coeur feu burning','💖':'coeur etincelle sparkle','💕':'coeurs hearts',
  '💯':'cent hundred parfait perfect','💢':'colere anger','💥':'explosion boom',
  '💫':'etoile dizzy','💦':'sueur sweat eau water','💨':'vent rapide fast wind',
  '💬':'bulle speech message','💭':'pensee thought','💤':'sommeil sleep zzz',
  '✨':'brillant etoile sparkle magie','🌟':'etoile star','⭐':'etoile star',
  '🔥':'feu flamme fire chaud hot','💧':'goutte drop eau','🌊':'vague wave mer',
  '🐶':'chien dog chiot','🐱':'chat cat chaton','🐭':'souris mouse','🐹':'hamster',
  '🐰':'lapin rabbit bunny','🦊':'renard fox','🐻':'ours bear','🐼':'panda',
  '🐨':'koala','🐯':'tigre tiger','🦁':'lion','🐮':'vache cow','🐷':'cochon pig',
  '🐸':'grenouille frog','🐵':'singe monkey','🙈':'singe see no evil',
  '🐔':'poule chicken','🐧':'pingouin penguin','🐦':'oiseau bird','🦆':'canard duck',
  '🦅':'aigle eagle','🦉':'hibou owl','🦇':'chauve souris bat','🐺':'loup wolf',
  '🐴':'cheval horse','🦄':'licorne unicorn','🐝':'abeille bee','🦋':'papillon butterfly',
  '🐌':'escargot snail','🐞':'coccinelle ladybug','🕷️':'araignee spider',
  '🐢':'tortue turtle','🐍':'serpent snake','🦖':'dinosaure t rex','🐙':'pieuvre octopus',
  '🦐':'crevette shrimp','🦀':'crabe crab','🐠':'poisson fish','🐬':'dauphin dolphin',
  '🐳':'baleine whale','🦈':'requin shark','🐊':'crocodile','🐘':'elephant',
  '🦒':'girafe giraffe','🐪':'chameau camel','🐎':'cheval horse','🦌':'cerf deer',
  '🐕':'chien dog','🐈':'chat cat',
  '🌵':'cactus','🎄':'sapin christmas tree','🌳':'arbre tree','🌴':'palmier palm',
  '🌱':'pousse sprout','🌿':'herbe herb','🍀':'trefle clover chance luck','🍄':'champignon mushroom',
  '💐':'bouquet flowers','🌷':'tulipe tulip','🌹':'rose','🌺':'hibiscus',
  '🌸':'fleur cerisier flower cherry blossom','🌼':'paquerette daisy','🌻':'tournesol sunflower',
  '🌞':'soleil sun visage','🌝':'lune moon','🌙':'lune moon croissant',
  '🌎':'terre earth globe','🪐':'planete planet saturn','⚡':'eclair lightning bolt',
  '🌈':'arc en ciel rainbow','☀️':'soleil sun','☁️':'nuage cloud','🌧️':'pluie rain',
  '❄️':'flocon neige snowflake','☃️':'bonhomme neige snowman','⛄':'bonhomme neige snowman',
  '🍎':'pomme apple','🍊':'orange','🍋':'citron lemon','🍌':'banane banana',
  '🍉':'pasteque watermelon','🍇':'raisin grapes','🍓':'fraise strawberry',
  '🍒':'cerise cherry','🍑':'peche peach','🥭':'mangue mango','🍍':'ananas pineapple',
  '🥝':'kiwi','🍅':'tomate tomato','🥑':'avocat avocado','🌶️':'piment chili',
  '🌽':'mais corn','🥕':'carotte carrot','🥔':'patate potato',
  '🍞':'pain bread','🥐':'croissant','🥖':'baguette','🧀':'fromage cheese',
  '🥚':'oeuf egg','🍳':'oeuf poele egg','🥞':'crepe pancake','🥓':'bacon',
  '🍗':'cuisse poulet drumstick','🍖':'viande meat','🌭':'hot dog',
  '🍔':'burger hamburger','🍟':'frites fries','🍕':'pizza','🥪':'sandwich',
  '🌮':'taco','🌯':'burrito','🥗':'salade salad','🍝':'pates pasta spaghetti',
  '🍜':'ramen nouilles noodles','🍣':'sushi','🍱':'bento','🍙':'onigiri',
  '🍚':'riz rice','🍤':'crevette tempura shrimp','🍦':'glace ice cream',
  '🍰':'gateau cake','🎂':'gateau anniversaire birthday cake','🧁':'cupcake',
  '🍩':'donut beignet','🍪':'biscuit cookie','🍫':'chocolat chocolate',
  '🍬':'bonbon candy','🍭':'sucette lollipop','🍯':'miel honey',
  '🥛':'lait milk','☕':'cafe coffee','🍵':'the tea','🥤':'soda boisson',
  '🍺':'biere beer','🍻':'biere trinquer cheers','🍷':'vin wine','🍾':'champagne',
  '🥂':'trinquer cheers','🍸':'cocktail','🥃':'whisky',
  '⚽':'foot football soccer ballon','🏀':'basket basketball','🏈':'football americain',
  '⚾':'baseball','🎾':'tennis','🏐':'volley volleyball','🏉':'rugby',
  '🎱':'billard billiard 8 ball','🏓':'ping pong','🏸':'badminton','🥊':'boxe boxing',
  '🥋':'judo karate','🎽':'maillot course','🛹':'skate skateboard','⛸️':'patinage skate',
  '🎿':'ski','🏂':'snowboard','🏄':'surf','🚴':'velo bike','🏊':'natation swim',
  '🧗':'escalade climbing','🧘':'yoga meditation','🏆':'trophee trophy','🥇':'medaille or gold',
  '🥈':'medaille argent silver','🥉':'medaille bronze','🎖️':'medaille militaire',
  '🎮':'jeu video game manette','🎲':'des dice','🎯':'cible target','🎰':'machine slot',
  '🧩':'puzzle','🎨':'peinture art','🎬':'cinema clap film','🎤':'micro microphone karaoke',
  '🎧':'casque headphones musique music','🎵':'note musique music','🎶':'musique music notes',
  '🎹':'piano','🎸':'guitare guitar','🥁':'batterie drums','🎺':'trompette trumpet',
  '🚗':'voiture car','🚕':'taxi','🚙':'suv 4x4 voiture','🚌':'bus','🚎':'trolley',
  '🏎️':'voiture course racing','🚓':'police voiture','🚑':'ambulance','🚒':'pompier fire truck',
  '🚜':'tracteur tractor','🛴':'trottinette scooter','🚲':'velo bike','🛵':'scooter moto',
  '🏍️':'moto motorbike','🚂':'train locomotive','🚆':'train','🚇':'metro subway',
  '🚊':'tram','✈️':'avion plane','🛫':'avion decollage','🛬':'avion atterrissage',
  '🚀':'fusee rocket','🛸':'soucoupe ufo','🚁':'helicoptere helicopter','⛵':'voilier sailboat',
  '🚤':'bateau speedboat','🚢':'paquebot ship','⚓':'ancre anchor','⛽':'essence gas',
  '🚦':'feu tricolore traffic light','🚧':'travaux construction',
  '🗽':'liberte statue','🗼':'tokyo tower eiffel','🏰':'chateau castle','🏯':'chateau japon',
  '🎡':'grande roue ferris wheel','🎢':'montagnes russes roller','🎠':'manege carousel',
  '⛲':'fontaine fountain','🏖️':'plage beach','🏝️':'ile island',
  '🏔️':'montagne mountain','🌋':'volcan volcano','🏕️':'camping tent',
  '🏠':'maison house home','🏡':'maison jardin home','🏢':'immeuble building',
  '🏥':'hopital hospital','🏦':'banque bank','🏨':'hotel','🏪':'magasin store conv',
  '🏫':'ecole school','⛪':'eglise church','🕌':'mosquee mosque','🕍':'synagogue',
  '🌅':'lever soleil sunrise','🌄':'aube dawn','🎆':'feu artifice fireworks',
  '🌃':'nuit night','🌌':'voie lactee milky way galaxy','🌉':'pont bridge',
  '⌚':'montre watch','📱':'telephone phone mobile portable','💻':'ordinateur laptop computer',
  '🖥️':'ordinateur desktop','🖨️':'imprimante printer','⌨️':'clavier keyboard',
  '🖱️':'souris mouse','🕹️':'joystick','💾':'disquette save floppy','💿':'cd disque',
  '📷':'appareil photo camera','📹':'camera video','🎥':'camera cinema',
  '📺':'television tv','📻':'radio','🎙️':'micro studio','⏰':'reveil alarm clock',
  '⌛':'sablier hourglass','⏳':'sablier hourglass','💡':'idee idea ampoule bulb',
  '🔦':'lampe flashlight torch','🕯️':'bougie candle',
  '💰':'sac argent money bag','💵':'dollar billet money','💴':'yen','💶':'euro','💷':'livre pound',
  '💳':'carte credit credit card','💎':'diamant diamond gem','⚖️':'balance scale justice',
  '🔧':'cle outil wrench tool','🔨':'marteau hammer','🛠️':'outils tools','⚙️':'engrenage gear',
  '🔪':'couteau knife','🗡️':'epee sword','⚔️':'epees crossed swords','🛡️':'bouclier shield',
  '💣':'bombe bomb','🧨':'dynamite firecracker','🔮':'boule cristal crystal ball',
  '💊':'pilule pill','💉':'seringue syringe vaccine','🌡️':'thermometre temperature fievre',
  '🧬':'adn dna','🔬':'microscope','🔭':'telescope',
  '🔑':'cle key','🔒':'cadenas lock','🔓':'cadenas ouvert unlock',
  '🛏️':'lit bed','🛋️':'canape couch sofa','🚿':'douche shower','🛁':'bain bathtub',
  '🧸':'ours peluche teddy bear','🎈':'ballon balloon','🎁':'cadeau gift present',
  '🎉':'fete confetti party','🎊':'confetti','🎂':'gateau anniversaire birthday',
  '🎀':'noeud bow ribbon','🪄':'baguette magic wand',
  '📚':'livres books','📖':'livre book ouvert open','📕':'livre rouge','📗':'livre vert',
  '📘':'livre bleu','📙':'livre orange','📰':'journal newspaper',
  '✏️':'crayon pencil','✒️':'plume pen','🖊️':'stylo pen','📝':'memo note ecrire',
  '📌':'punaise pin','📍':'epingle pin location','✂️':'ciseaux scissors',
  '🔍':'loupe magnifying recherche search','🔎':'loupe search',
  '⭐':'etoile star','🌟':'etoile star glowing','✨':'etincelle sparkle magie',
  '⚠️':'attention warning danger','🚫':'interdit forbidden no','❌':'croix x cross wrong',
  '✅':'coche check ok valide','☑️':'coche check','❗':'exclamation','❓':'question',
  '♻️':'recyclage recycle','💯':'cent perfect score','🔞':'18 plus interdit mineurs',
  '0️⃣':'zero 0','1️⃣':'un one 1','2️⃣':'deux two 2','3️⃣':'trois three 3',
  '4️⃣':'quatre four 4','5️⃣':'cinq five 5','6️⃣':'six 6','7️⃣':'sept seven 7',
  '8️⃣':'huit eight 8','9️⃣':'neuf nine 9','🔟':'dix ten 10',
  '🔴':'rouge red','🟠':'orange','🟡':'jaune yellow','🟢':'vert green',
  '🔵':'bleu blue','🟣':'violet purple','⚫':'noir black','⚪':'blanc white',
  '🏁':'drapeau damier finish flag','🚩':'drapeau rouge triangulaire red flag',
  '🏴':'drapeau noir black','🏳️':'drapeau blanc white','🏳️‍🌈':'arc en ciel rainbow lgbt pride',
  '🏳️‍⚧️':'trans transgender','🏴‍☠️':'pirate jolly roger',
  '🇫🇷':'france francais french fr','🇧🇪':'belgique belgium','🇨🇭':'suisse switzerland',
  '🇨🇦':'canada','🇺🇸':'etats unis usa america','🇬🇧':'royaume uni uk angleterre',
  '🇪🇸':'espagne spain','🇮🇹':'italie italy','🇩🇪':'allemagne germany',
  '🇯🇵':'japon japan','🇰🇷':'coree korea','🇨🇳':'chine china','🇧🇷':'bresil brazil'
};

function normalizeEmojiSearch(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function buildEmojiPickerHtml(pickerKey) {
  const cats = Object.keys(EMOJI_CATEGORIES);
  const tabs = cats.map(cat =>
    `<button type="button" class="emoji-tab" data-cat="${cat}" title="${cat}" aria-label="${cat}">${EMOJI_CATEGORY_ICONS[cat] || '·'}</button>`
  ).join('');

  const sections = cats.map((cat) => {
    const items = EMOJI_CATEGORIES[cat].map(e => {
      const hay = `${EMOJI_KEYWORDS[e] || ''} ${cat}`;
      const search = normalizeEmojiSearch(hay);
      return `<button type="button" class="emoji-pick" data-emoji="${e}" data-search="${search}">${e}</button>`;
    }).join('');
    return `<div class="emoji-cat-title" data-cat="${cat}">${cat}</div>${items}`;
  }).join('');

  return `<div class="emoji-picker" data-key="${pickerKey}">
    <div class="emoji-picker-tabs">${tabs}</div>
    <div class="emoji-picker-search-wrap">
      <input type="search" class="emoji-picker-search" placeholder="Rechercher…" aria-label="Rechercher un emoji" autocomplete="off">
    </div>
    <div class="emoji-picker-grid">${sections}</div>
    <div class="emoji-picker-empty" hidden>Aucun emoji trouvé</div>
  </div>`;
}

function filterEmojiPicker(picker, query) {
  const q = normalizeEmojiSearch(query);
  const grid = picker.querySelector('.emoji-picker-grid');
  const buttons = grid.querySelectorAll('.emoji-pick');
  const titles = grid.querySelectorAll('.emoji-cat-title');
  const empty = picker.querySelector('.emoji-picker-empty');

  if (!q) {
    buttons.forEach(b => b.hidden = false);
    titles.forEach(t => t.hidden = false);
    empty.hidden = true;
    return;
  }
  titles.forEach(t => t.hidden = true);
  let anyVisible = false;
  buttons.forEach(b => {
    const match = (b.dataset.search || '').includes(q);
    b.hidden = !match;
    if (match) anyVisible = true;
  });
  empty.hidden = anyVisible;
}

function scrollEmojiPickerToCat(picker, cat) {
  const search = picker.querySelector('.emoji-picker-search');
  if (search && search.value) { search.value = ''; filterEmojiPicker(picker, ''); }
  const title = picker.querySelector(`.emoji-cat-title[data-cat="${cat}"]`);
  const grid = picker.querySelector('.emoji-picker-grid');
  if (!title || !grid) return;
  grid.scrollTo({ top: title.offsetTop - 4, behavior: 'smooth' });
}

function wireEmojiPicker(picker, onPick) {
  picker.addEventListener('click', (e) => {
    const tab = e.target.closest('.emoji-tab');
    if (tab) { scrollEmojiPickerToCat(picker, tab.dataset.cat); return; }
    const pick = e.target.closest('.emoji-pick');
    if (pick && pick.dataset.emoji) { onPick(pick.dataset.emoji); }
  });
  const search = picker.querySelector('.emoji-picker-search');
  if (search) {
    search.addEventListener('input', (e) => filterEmojiPicker(picker, e.target.value));
    search.addEventListener('click', (e) => e.stopPropagation());
  }
}

// Picker dans la zone de saisie (textarea) — inséré au-dessus du bouton qui l'ouvre.
function toggleEmojiPicker(targetInputId, btn) {
  const key = `input-${targetInputId}`;
  const existing = document.querySelector(`.emoji-picker[data-key="${key}"]`);
  if (existing) { existing.remove(); return; }
  document.querySelectorAll('.emoji-picker').forEach(p => p.remove());
  const wrap = btn.closest('.emoji-picker-host') || btn.closest('.chat-input-form') || btn.parentElement;
  if (!wrap) return;
  wrap.insertAdjacentHTML('beforeend', buildEmojiPickerHtml(key));
  const picker = wrap.querySelector(`.emoji-picker[data-key="${key}"]`);
  wireEmojiPicker(picker, (emoji) => insertEmoji(targetInputId, emoji));
}

function insertEmoji(targetInputId, emoji) {
  const input = document.getElementById(targetInputId);
  if (!input) return;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const before = input.value.slice(0, start);
  const after = input.value.slice(end);
  input.value = before + emoji + after;
  const caret = start + emoji.length;
  input.focus();
  try { input.setSelectionRange(caret, caret); } catch (_) {}
  // Déclenche un éventuel listener `input` (pour les compteurs de mots, etc.)
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

// Barre rapide de réactions (avec bouton "+" pour ouvrir le picker complet).
function showQuickReactionBar(anchor, quickList, onPick, onMore) {
  document.querySelectorAll('.reaction-quick-bar').forEach(b => b.remove());
  document.querySelectorAll('.emoji-picker').forEach(p => p.remove());
  const items = quickList.map(e =>
    `<button type="button" class="reaction-quick" data-emoji="${e}">${e}</button>`
  ).join('');
  anchor.insertAdjacentHTML('beforeend',
    `<div class="reaction-quick-bar">${items}<button type="button" class="reaction-quick reaction-quick-more" data-action="more" aria-label="Plus d'emojis">➕</button></div>`
  );
  const bar = anchor.querySelector(':scope > .reaction-quick-bar');
  if (!bar) return;
  bar.addEventListener('click', (e) => {
    const more = e.target.closest('[data-action="more"]');
    if (more) {
      e.stopPropagation();
      bar.remove();
      if (typeof onMore === 'function') onMore();
      return;
    }
    const quick = e.target.closest('.reaction-quick');
    if (quick && quick.dataset.emoji) {
      onPick(quick.dataset.emoji);
      bar.remove();
    }
  });
}

// Picker complet flottant (ancré bottom-right par défaut).
function openFloatingFullPicker(anchor, key, onPick) {
  document.querySelectorAll('.emoji-picker').forEach(p => p.remove());
  anchor.insertAdjacentHTML('beforeend', buildEmojiPickerHtml(key));
  const picker = anchor.querySelector(`.emoji-picker[data-key="${key}"]`);
  if (!picker) return;
  picker.classList.add('emoji-picker-floating');
  wireEmojiPicker(picker, (emoji) => {
    onPick(emoji);
    picker.remove();
  });
  setTimeout(() => picker.querySelector('.emoji-picker-search')?.focus(), 50);
}

// Fermeture sur clic en dehors (un seul listener global pour tous les pickers).
document.addEventListener('click', (e) => {
  if (e.target.closest('.emoji-picker')) return;
  if (e.target.closest('.emoji-toggle-btn')) return;
  if (e.target.closest('.reaction-add-btn')) return;
  if (e.target.closest('.comment-reaction-add-btn')) return;
  if (e.target.closest('.reaction-quick-more')) return;
  document.querySelectorAll('.emoji-picker').forEach(p => p.remove());
  document.querySelectorAll('.reaction-quick-bar').forEach(b => b.remove());
});
