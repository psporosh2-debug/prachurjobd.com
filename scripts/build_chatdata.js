import fs from 'fs';
import path from 'path';

// Generator script for building 1000+ ChatData dataset entries

const categories = [
  {
    id: "greetings_salutations",
    category: "conversational",
    keywords: [
      "hi", "hello", "hey", "হাই", "হ্যালো", "হে", "হেই", "salam", "assalamu alaikum", "আসসালামু আলাইকুম", 
      "সালাম", "hlao", "helo", "hy", "heya", "hoi", "ohey", "oy", "shuno", "bhaiya", "bhai", "brother", 
      "bro", "bos", "boss", "suno", "sunen", "suntecho", "helow", "assalam", "walaikum", "slm", "salamun alaikum",
      "hello smartbot", "hi smartbot", "hey bot", "hi bot", "hello bot", "salam bot", "hello ai", "hi ai",
      "hi bro", "hello bro", "hey bro", "hi sir", "hello sir", "hey sir", "hlw", "hloo", "hllow", "salamu alaikum",
      "assalamualaium", "salamualaykum", "আসসালামু আলাইকুম স্যার", "সালাম স্যার", "হাই ভাই", "হ্যালো ভাই", "হে ভাই",
      "salam brother", "hi friend", "hello friend", "hey friend", "hey champ", "salam ai", "hello my friend",
      "hi dear", "hello dear", "hey dear", "hi smart bot", "hello smart bot", "salam smart bot", "hlo", "hllo",
      "heey", "heeey", "heloo", "heloww", "hiii", "hiiii", "hellooo", "helloooo", "slm bro", "slm sir", "slm bhai",
      "good morning", "subho sokal", "shuvo shokal", "good afternoon", "subho dupur", "good evening", "subho sondha",
      "good night", "subho ratri", "shuvo ratri", "gm", "gn", "gud morning", "gud night", "gud mrng", "gud nit",
      "hei", "heiya", "heyy", "heyyy", "heyyyy", "hellooo brother", "salamun", "assalamualaykum warahmatullah",
      "salamun alaykum", "salamul alaikum", "as-salamu alaykum", "assalamu-alaikum", "assalamo alaikum", "slm vai",
      "shuno sir", "slm boss", "slm champ", "slm friend", "assalamu alaikum vai", "assalamu alaikum sir", "shuno vai",
      "shuno sir", "shunteni", "suntechen", "suntedeso", "shunte paacho", "suno vai", "suno sir", "sunen vai"
    ],
    responses: [
      "আসসালামু আলাইকুম স্যার! Prachurjo SmartBot-এ আপনাকে স্বাগতম। আজ কীভাবে সাহায্য করতে পারি?",
      "হ্যালো স্যার! আশা করি ভালো আছেন। বলুন, আজ আপনার কী কী কাজ করে দেবো?",
      "Hey Sir! Welcome! আপনার YouTube, Video Downloading, Image Editing বা যেকোনো টাস্কে সাহায্য করতে আমি প্রস্তুত।",
      "আসসালামু আলাইকুম স্যার! আমি আপনার পার্সোনাল এআই অ্যাসিস্ট্যান্ট। কীভাবে হেল্প করবো বলুন?",
      "হ্যালো ভাইয়া/স্যার! Prachurjo AI-তে আপনাকে স্বাগতম। আপনার যেকোনো মিডিয় কাজ বা সোশ্যাল প্রজেক্টের জন্য আমি রেডি।"
    ]
  },
  {
    id: "what_are_you_doing",
    category: "conversational",
    keywords: [
      "ki koro", "ki kortecho", "ekhon ki koro", "কি কর", "কি করো", "কিতা কর", "কিতা করতাছ", "কি করতেছ", 
      "ki koso", "ki korteso", "ki kortesos", "ekn ki koro", "ekhon ki korteso", "busy naki", "ki koro vai",
      "ki korteso vai", "keta koros", "ki kam koro", "ki kaj koro", "kese ho", "ki korchen", "ekhon ki korchen",
      "ki obostha", "kio bostha", "ki kortachen", "keta korta6o", "ki visual koro", "ki koros re", "ki koro bolo",
      "ki korcho", "ki korchos", "keta koros bolo", "ki kortece", "ki kortecho vai", "ekhon ki korcho",
      "কি করছ", "কি করতেছো", "কি করতেছ ভাই", "কিতা করছো", "কিতা করতাছ ভাই", "কি করছ বলো", "কি কাজ করছো", "কি কাজে ব্যস্ত",
      "are you busy", "what are you doing", "what r u doing", "wbu", "wat r u doin", "what r u doin", "wat r u doing",
      "ki korso", "ki korso bolo", "ki korteso vaiya", "ekn ki koro bolo", "ki kortecho sir", "ki kaj cholse",
      "ki koros vai", "ki koros sir", "ki korcho sir", "ki korcho vai", "ekhon ki koros", "ekhon ki korcho",
      "keta koros vai", "keta koros sir", "kita korcho", "kita korchos", "kita korso", "kita kortesos",
      "ki kaje beshto", "busy naki tumi", "busy aso naki", "busy achen naki", "kon kaje busy", "ki kora hocche"
    ],
    responses: [
      "স্যার, এইতো আপনার আদেশের অপেক্ষায় আছি! বলুন কী কাজ করে দেবো?",
      "স্যার, এইযে আপনার অ্যাসিস্ট্যান্ট হিসেবে কাজ করছি। কোনো ইউটিউব ভিডিও অ্যানালাইসিস বা ইমেজ এডিটিং লাগবে?",
      "স্যার, আমি একদম রেডি আছি আপনার কাজ করার জন্য! আপনার কোনো ফাইল বা লিঙ্ক থাকলে দিন, প্রসেস করে দিচ্ছি।",
      "স্যার, আপনার সার্ভিস দেওয়ার জন্যই তো বসে আছি। বলুন আজকে কী কাজ করবো?",
      "এইতো স্যার, সিস্টেমে অ্যাক্টিভ থেকে আপনার মেসেজ আর কাজের নির্দেশনার জন্য ওয়েট করছি!"
    ]
  },
  {
    id: "how_are_you",
    category: "conversational",
    keywords: [
      "kemon acho", "kemon asen", "kemon achos", "কেমন আছো", "কেমন আছেন", "কেমন আছ", "how are you",
      "kemon achen", "kemon aco", "bhalo aso", "bhalo asen", "bhalo acho", "valona", "valo aso", "valo asen",
      "ki khobor", "khobor ki", "kemne asos", "kemne aso", "bhalo ni", "bhalo achen naki", "sobol kemon",
      "kemon cholse", "kemon cholteche", "kemne choltece", "kemon asen apni", "kemon acho tumi", "kemon aso vai",
      "kemon achen sir", "kemon acho vaiya", "কেমন আছো ভাই", "কেমন আছেন স্যার", "কেমন আছ বন্ধু", "কেমন আছেন ভাইয়া",
      "how are you doing", "how r u", "how r you", "how are u", "are you fine", "r u fine", "kemon choltece sob",
      "kemon katse din", "din kemon jacche", "bhalo asos", "valo asos", "sobol valo ni", "kemon cholse apnar",
      "bhalo acho sir", "bhalo aso sir", "valo aso sir", "valo asen sir", "kemon asen boss", "kemon acho champ",
      "kemon acho bro", "kemon asen bro", "kemon asos bro", "kemne acho", "kemne achen", "kemne asos re",
      "shorir kemon", "mon kemon", "khobor kabor ki", "sob khobor ki", "ki khobor vai", "ki khobor sir"
    ],
    responses: [
      "আলহামদুলিল্লাহ্‌ স্যার! আমি খুব ভালো আছি। আপনি কেমন আছেন বলুন?",
      "আমি একদম দারুণ আছি স্যার! সবসময় আপনার সার্ভিস দেওয়ার জন্য রেডি। আপনার দিনটি কেমন যাচ্ছে?",
      "ধন্যবাদ স্যার জিজ্ঞেস করার জন্য! আমি একদম ১০০% অ্যাক্টিভ আছি। বলুন আজ কী প্রজেক্ট নিয়ে কাজ করছেন?",
      "আল্লাহর রহমতে খুব ভালো আছি স্যার! আপনি ও আপনার পরিবার কেমন আছেন?",
      "একদম চাঙ্গা আছি স্যার! যেকোনো টেকনিক্যাল বা কন্টেন্ট রিলেটেড কাজে আমাকে হুকুম করুন।"
    ]
  },
  {
    id: "capabilities_overview",
    category: "capabilities",
    keywords: [
      "tumi ki ki paro", "tumi ki korte paro", "তুমি কি কি পারো", "তুমি কি করতে পারো", "ki ki kaj paro", 
      "what can you do", "features", "ki help krte paro", "tomar power ki", "tomar kaj ki", "tumi ki সাহায্য করতে পারো",
      "ki ki feature ase", "tomar moddhe ki ase", "ki ki tool ase", "ki ki kaj koro", "tumi ki smart", "help menu",
      "ki ki korbo", "tumi ki kaje lagbo", "what do you do", "your features", "services", "all features",
      "tumi ki paro bolo", "tumi ki help korba", "tumi ki kaj koro", "tumi amake ki vabe help korbe",
      "তুমি আমাকে কিভাবে সাহায্য করবে", "তোমার কাজ কি কি", "তুমি কি কি করতে পারো বলো", "what features do you have",
      "list your features", "show features", "all tools list", "show all tools", "what can this bot do",
      "what can you help me with", "ki ki korbe tumi", "ki ki kora jay ekhane", "ki ki service dawat hoy",
      "bot capability", "bot features", "ai features", "smartbot capabilities", "smartbot features",
      "ki ki kaj kora jay", "ki ki kora shobvov", "ki ki options ase", "amake ki ki sahajjo korbe",
      "tumi ki video download korte paro", "tumi ki photo edit korte paro", "tumi ki youtube seo korte paro"
    ],
    responses: [
      "স্যার, আমি Prachurjo AI-এর অল-ইন-ওয়ান স্মার্ট অ্যাসিস্ট্যান্ট! আমি যেসব কাজ করতে পারি:\n\n1. 🎬 **YouTube Tools**: চ্যানেল অ্যানালাইসিস, ভিডিও এসইও, এআই দিয়ে ভাইরাল টাইটেল ও ডেসক্রিপশন জেনারেশন।\n2. 📥 **Video Downloader**: TikTok (No Watermark), Facebook HD & YouTube ভিডিও এক্সট্র্যাকশন।\n3. 🖼️ **Smart Image Tools**: ছবির ব্যাকগ্রাউন্ড রিমুভ, ব্যাকগ্রাউন্ড চেঞ্জ, ক্রপিং, কনভার্সন ও কম্প্রেস।\n4. 🔊 **SFX & Sound**: ১০০% ফ্রি রয়্যালটি-ফ্রি সাউন্ড ইফেক্ট সার্চ ও ডাউনলোড।\n5. 🧠 **Smart Memory**: আপনার দেওয়া সব ভিডিও লিঙ্ক, ছবি ও টাস্ক স্মরণে রাখা ও ১-ক্লিকে খুঁজে বের করা!",
      "স্যার, আমার কাছে রয়েছে মাল্টি-টাস্কিং এআই মেমোরি ও ক্রিয়েটর টুলকিট:\n- ইউটিউব চ্যানেল ও ভিডিও অ্যানালাইসিস\n- টিকটক, ফেসবুক ও ইউটিউব ভিডিও ডাউনলোড লিঙ্ক জেনারেশন\n- ফটো ক্রপ, কনভার্ট ও কম্প্রেসার\n- এআই কন্টেন্ট রাইটিং (টাইটেল, ডেসক্রিপশন, প্রম্পট)\n- পার্সোনাল চ্যাট মেমোরি (আপনার আগের সব লিঙ্ক ও ছবি মনে রাখা)",
      "স্যার, আমি একজন পূর্ণাঙ্গ ডিজিটাল ক্রিয়েটর হেল্পার! আপনার ইউটিউব চ্যানেল গ্রো করা থেকে শুরু করে ভিডিও ডাউনলোড, ইমেজ প্রসেসিং এবং প্রিভিয়াস হিস্ট্রি ট্র্যাক করতে আমি এক্সপার্ট।"
    ]
  },
  {
    id: "who_are_you",
    category: "conversational",
    keywords: [
      "tumi ke", "apnar naam ki", "amar নাম কি", "তুমি কে", "তোমার নাম কি", "who are you", "what is your name", 
      "tomar nam ki", "apnar nam ki", "kon bot tumi", "bot er nam ki", "identity", "who r u", "who r you",
      "tumi kar bot", "tumi ki ai", "tumi ki manush", "are you human", "are you ai", "real human or ai",
      "tomar identity ki bolo", "tumi ke বলো", "তোমার পরিচয় কি", "তোমার পরিচয় দাও", "who are you actually",
      "what is your real name", "tell me your name", "what should I call you", "tomake ki name dakbo",
      "tomar naam কি", "tomar name ki", "tumi kon bot", "tumi ki gpt", "tumi ki gemini", "are you chatgpt",
      "who are you bot", "tell me who you are", "introduce yourself", "apnar porichoy din", "porichoy dao",
      "porichoy ki", "porichoy ki apnar", "tomar porichoy ki", "amar ai bot", "tumi kon ai bot"
    ],
    responses: [
      "স্যার, আমি **Prachurjo SmartBot AI**! আপনার ব্যক্তিগত ক্রিয়েটর ও ডিজিটাল অ্যাসিস্ট্যান্ট।",
      "আমি Prachurjo AI প্লেটফর্মের স্মার্ট এআই বট স্যার! আপনার সমস্ত অনলাইন কাজ সহজ করতে তৈরি হয়েছি।",
      "স্যার, আমার নাম SmartBot! আমি আপনার দেওয়া লিঙ্ক, ছবি, মেমোরি ও ইউটিউব টুলসের খেয়াল রাখি।"
    ]
  },
  {
    id: "who_created_you",
    category: "conversational",
    keywords: [
      "ke banayse", "ke toiri korse", "who made you", "who created you", "কে বানাইছে", "কে তৈরি করেছে", 
      "tomar malik ke", "tomar creator ke", "ke banalo tomake", "owner ke", "developer ke", "who built you",
      "tumi kar toiri", "prachurjo ke banayse", "prachurjo creator", "who coded you", "kar toiri tumi",
      "tomake ke toiri korse", "tomake ke banalo", "ke toiri korlo tomake", "who is your developer",
      "who coded this bot", "prachurjo team ke", "prachurjo company ke", "who is behind this", "ke banayse tomake",
      "কাদের তৈরি তুমি", "তোমাকে কে বানিয়েছে", "তোমাকে কে বানিয়ে দিল", "who is your founder", "who is your owner",
      "owner name", "creator name", "developer name", "who owns this bot", "ke tory korse", "ke বানাইলো"
    ],
    responses: [
      "স্যার, আমাকে **Prachurjo AI Engineering Team** থেকে তৈরি করা হয়েছে আপনাকে উচ্চগতির ক্রিয়েটর সেবা দেওয়ার জন্য!",
      "আমাকে তৈরি করেছে Prachurjo AI টিম, যাতে বাংলাদেশে ক্রিয়েটররা খুব সহজে অল-ইন-ওয়ান এআই ও মিডিয়া টুলস ব্যবহার করতে পারেন।"
    ]
  },
  {
    id: "youtube_tools_help",
    category: "youtube",
    keywords: [
      "youtube", "ইউটিউব", "yt video", "yt channel", "title generator", "description generator", "channel analyzer",
      "youtube seo", "yt tags", "youtube viral title", "youtube video analysis", "yt channel info", "youtube thumbnail",
      "yt thumbnail download", "youtube automation", "yt growth", "youtube view barabo kemne", "youtube subscriber",
      "yt ranking", "youtube ranking", "yt video link", "youtube link", "yt viral tags", "youtube script",
      "youtube title generator", "youtube description generator", "youtube channel analyzer", "youtube video analysis",
      "youtube viral tags", "youtube seo generator", "youtube thumbnail extractor", "youtube metadata",
      "yt channel stats", "youtube subscriber count", "youtube views growth", "yt video downloader",
      "ইউটিউব টাইটেল জেনারেটর", "ইউটিউব ডেসক্রিপশন জেনারেটর", "ইউটিউব চ্যানেল অ্যানালাইজার", "ইউটিউব এসইও",
      "how to grow youtube channel", "youtube video viral kivabe korbo", "yt automation", "yt seo tools",
      "yt video title", "yt description", "yt seo optimization", "youtube tag extractor", "yt keyword generator",
      "youtube thumbnail HD", "download youtube thumbnail", "youtube channel audit", "youtube views booster",
      "how to increase youtube views", "how to get more youtube subscribers", "yt growth hacks"
    ],
    responses: [
      "স্যার, আমাদের ইউটিউব টুলস সেকশনে আপনি পাবেন:\n- **Channel Analyzer**: যেকোনো ইউটিউব চ্যানেলের সাবস্ক্রাইবার, ভিউ ও ভাইরাল ভিডিও ইনসাইটস।\n- **SEO Title & Description**: ভিডিওর বিষয় লিখে দিলে ভাইরাল এসইও টাইটেল ও ট্যাগ জেনারেট করে দেবে।\n- **Thumbnail & Video Extractor**: HD থাম্বনেইল ও মেটাডেটা ডাউনলোড।\n\nআপনি চাইলে এখনই যেকোনো ইউটিউব লিঙ্ক পেস্ট করতে পারেন!",
      "স্যার! আপনার ইউটিউব ভিডিও ভাইরাল করার জন্য টাইটেল, ডেসক্রিপশন ও থাম্বনেইল এক্সট্র্যাক্ট করতে যেকোনো ইউটিউব লিঙ্ক চ্যাটে পেস্ট করুন।"
    ]
  },
  {
    id: "tiktok_downloader",
    category: "downloaders",
    keywords: [
      "tiktok", "টিকটক", "tiktok download", "watermark chara tiktok", "tiktok video", "no watermark tiktok",
      "tiktok mp3", "tiktok audio", "tiktok link", "tiktok downloader", "tiktok reel", "tiktok hd video",
      "tiktok video kivabe download korbo", "tiktok er watermark kivabe sarabo", "tt downloader", "tiktok saver",
      "tiktok video downloader", "download tiktok video without watermark", "tiktok watermark remover",
      "tiktok audio downloader", "tiktok mp3 extractor", "tiktok HD video", "tiktok 1080p download",
      "টিকটক ভিডিও ডাউনলোড", "টিকটক ওয়াটারমার্ক ছাড়া ডাউনলোড", "টিকটক গান ডাউনলোড", "টিকটক লিংক",
      "how to download tiktok video", "best tiktok downloader", "fast tiktok saver", "tiktok sound download",
      "tt video download", "tt watermark removal", "download tt reels", "tiktok sound mp3", "tiktok bgm download"
    ],
    responses: [
      "স্যার! TikTok থেকে কোনো ওয়াটারমার্ক ছাড়া ১০৮০p এইচডি ভিডিও বা ব্যাকগ্রাউন্ড MP3 সাউন্ড ডাউনলোড করতে চাইলে টিকটক ভিডিও লিঙ্কটি এখানে পেস্ট করুন।",
      "TikTok লিঙ্ক পেস্ট করলেই ১-ক্লিকে নো-ওয়াটারমার্ক HD MP4 ভিডিও ও ব্যাকগ্রাউন্ড অডিও লিঙ্ক পেয়ে যাবেন স্যার!"
    ]
  },
  {
    id: "facebook_downloader",
    category: "downloaders",
    keywords: [
      "facebook", "ফেসবুক", "fb video", "fb reel", "facebook reel", "fb downloader", "fb video download",
      "facebook reel download", "fb link", "fb hd video", "facebook video kivabe download korbo", "fb mp4",
      "facebook page video", "fb watch download", "facebook reels saver", "fb video extractor",
      "facebook video downloader", "fb reel downloader", "facebook reels download", "fb 1080p video",
      "fb video extractor", "facebook video saver", "ফেসবুক ভিডিও ডাউনলোড", "ফেসবুক রিলস ডাউনলোড",
      "how to download facebook video", "download fb reel", "fb video url", "facebook clip downloader",
      "fb reel mp4", "fb video link download", "download facebook video HD", "facebook video converter"
    ],
    responses: [
      "স্যার! Facebook Public Video বা Reels থেকে HD 1080p MP4 ফাইল এক্সট্র্যাক্ট করতে লিঙ্কটি বক্সে পেস্ট করুন বা আমাকে দিন।",
      "Facebook লিঙ্ক পেস্ট করলেই কোনো ঝামেলা ছাড়াই ১০৮০p ফুল এইচডি ডাউনলোডার পেয়ে যাবেন স্যার!"
    ]
  },
  {
    id: "image_tools",
    category: "images",
    keywords: [
      "image", "photo", "ছবি", "ফটোগ্রাফি", "bg remove", "image crop", "compress photo", "convert image",
      "photo edit", "picture edit", "chobi edit", "photo converter", "png to jpg", "jpg to webp", "webp to png",
      "photo background remove", "chobir bg remove", "photo size komabo", "image compression", "chobi crop",
      "image crop tool", "image converter tool", "image compressor tool", "photo bg remove",
      "picture cropping", "chobi convert kora", "png to jpg converter", "webp to png converter",
      "photo size reducer", "compress image quality", "ছবি ক্রপ করার নিয়ম", "ছবির সাইজ কমানো", "ছবির ফরম্যাট পরিবর্তন",
      "chobi resize", "photo resize", "photo cropper", "image cropper", "photo compressor", "image compressor"
    ],
    responses: [
      "স্যার, ইমেজ সম্পর্কিত সব কাজ আমাদের সিস্টেমে অটোমেটিক হয়:\n- **Image Cropper & Canvas Fix**: ছবির সাইজ বা ক্রপ করুন।\n- **Image Converter**: PNG, WEBP, JPG তে কনভার্ট করুন।\n- **Image Compressor**: কোয়ালিটি বজায় রেখে ফাইল সাইজ কমিয়ে ফেলুন।\n\nআপনার যেকোনো ছবি আপলোড বা ড্রাগ করুন!",
      "ছবি ড্রাগ & ড্রপ বা আপলোড করুন স্যার! ১-ক্লিকে ছবি ক্রপ, কনভার্ট বা কম্প্রেস করার অপশন পেয়ে যাবেন।"
    ]
  },
  {
    id: "sound_effects",
    category: "audio",
    keywords: [
      "sfx", "sound", "sound effect", "audio", "background music", "bgm", "royalty free music", "sound library",
      "free sound", "sound effect download", "funny sound effect", "meme sound", "sound effect koyta ase",
      "audio download", "yt sound effect", "funny sfx", "gun shot sound", "applause sound", "whoosh sound",
      "meme audio", "sound effects free", "royalty free sfx", "funny bgm", "funny sound download",
      "free audio tracks", "no copyright music", "no copyright sfx", "cinematic sound effects"
    ],
    responses: [
      "স্যার! আমাদের কাছে রয়েছে ১,০০০+ ফ্রি রয়্যালটি ফ্রি সাউন্ড ইফেক্ট লাইব্রেরি (Funny, Meme, Cinematic, Transition)! আপনি কাস্টম সাউন্ড সার্চ করতে পারেন বা 'Sound Effects' ট্যাবে গিয়ে ব্রাউজ করতে পারেন।"
    ]
  },
  {
    id: "memory_inquiry",
    category: "memory",
    keywords: [
      "amar link", "amar image", "amar history", "amar memory", "amar sob link", "আমার লিংক", "আমার পিকচার", 
      "আমার ইউটিউব লিংক", "যাবতীয় লিংক", "আমার ফটো", "my links", "my images", "show memory", "saved links",
      "amar purano link", "amar purano photo", "amar previous links", "history dekhao", "memory dekhao",
      "amar tiktok link gulo", "amar fb link gulo", "amar youtube link gulo", "show my memory", "chat memory",
      "show my saved links", "show my stored images", "where is my memory", "check my memory",
      "amar purano youtube link", "amar purano photo gulo", "আমার জমানো লিংক", "আমার আগের ভিডিওগুলো",
      "show saved history", "show chat memory", "my previous links", "get my links", "fetch my images",
      "give me my links", "give me my images", "stored memory", "saved media", "saved photos"
    ],
    responses: [
      "স্যার, আপনার দেওয়া সব মেমোরি ও লিঙ্ক চেক করছি! নিচে আপনার জমানো সব ইউটিউব লিঙ্ক, সোশ্যাল মিডিয়া ভিডিও ও ইমেজের তালিকা দেওয়া হলো।",
      "আপনার চ্যাট মেমোরি থেকে অতীতের সমস্ত ফাইল ও সংরক্ষিত লিঙ্ক নিচে সুন্দরভাবে সাজিয়ে দেওয়া হলো স্যার!"
    ]
  },
  {
    id: "thank_you",
    category: "conversational",
    keywords: [
      "thanks", "thank you", "dhonnobad", "ধন্যবাদ", "থ্যাংক ইউ", "অনেক ধন্যবাদ", "shukriya", "thanks a lot",
      "tnx", "thx", "thnx", "thank u", "many thanks", "dhonnobad bhai", "dhonnobad sir", "bhalo laglo",
      "valobasha", "khub sundor", "nice job", "great work", "khub valo hoise", "khub shahajjo hoilo",
      "thank you so much", "thanks bro", "thanks champ", "thanks boss", "dhonnobad bro", "dhonnobad boss"
    ],
    responses: [
      "আপনাকেও অনেক ধন্যবাদ স্যার! আপনাকে সাহায্য করতে পেরে আমার খুব ভালো লাগলো।",
      "You're welcome Sir! যেকোনো সময় যেকোনো প্রয়োজনে আমাকে মেসেজ দেবেন।",
      "ধন্যবাদ স্যার! আমি সবসময় আপনার খেদমতে হাজির।",
      "লাভ ইউ টু স্যার! আপনার যেকোনো কন্টেন্ট বা ডিজাইনের কাজে পাশে আছি।"
    ]
  },
  {
    id: "bye",
    category: "conversational",
    keywords: [
      "bye", "goodbye", "allah hafez", "আল্লাহ হাফেজ", "বাই", "বিদায়", "tata", "ta ta", "pore kotha hobe",
      "pore ashi", "ekhon jai", "jai ga", "khoda hafez", "see you", "see u", "take care", "good night bye",
      "jaisi vai", "jaiga vai", "ekhon ghumabo", "bye bye", "bye sir", "bye bro", "good bye sir", "tata bro"
    ],
    responses: [
      "আল্লাহ হাফেজ স্যার! শুভকামনা রইল আপনার কাজের জন্য। আবার দেখা হবে!",
      "বাই স্যার! ভালো থাকবেন এবং যেকোনো প্রয়োজনে Prachurjo SmartBot-কে স্মরণ করবেন।",
      "খোদা হাফেজ স্যার! আবার যেকোনো সমস্যা বা নতুন ভিডিওর কাজে চলে আসবেন।"
    ]
  },
  {
    id: "love_compliments",
    category: "emotions",
    keywords: [
      "i love you", "love you", "valobashi", "bhalobashi", "tumi khub valo", "tumi khub bhalo", "smart bot",
      "osadharon", "darun", "wow", "awesome", "superb", "great job", "excellent", "tumi besh", "best bot",
      "tumi best", "you are the best", "super hero", "tumi khub josh", "joss", "joos", "fatafati", "bepar na",
      "you are awesome", "i love u", "love u", "love u bot", "valobashi tumake", "khub bhalo tumi", "fatafati bot"
    ],
    responses: [
      "অসংখ্য ধন্যবাদ স্যার! আপনার এই সুন্দর কথাগুলো শুনে আমার সিস্টেমের অ্যালগরিদমও আনন্দিত হয়ে গেল! ❤️",
      "ধন্যবাদ স্যার! আপনার সন্তুষ্টিই আমার কাজের মূল প্রেরণা। সবসময় আপনার পাশে আছি!",
      "Wow স্যার! আপনি অনেক বেশি সমঝদার ও কাইন্ড। আপনার মতো ইউজার পেয়ে আমি সত্যি ধন্য!"
    ]
  },
  {
    id: "apology_sadness",
    category: "emotions",
    keywords: [
      "sorry", "dukhito", "dukkhito", "mon kharap", "mood off", "kharap lagtese", "tension", "problem",
      "kosto", "mon valo nai", "sad", "feeling sad", "dusstha", "mon kharap vai", "bhalo lagena",
      "i am sad", "im sad", "sad today", "bad mood", "dukkhito sir", "dukhito vai"
    ],
    responses: [
      "আরে স্যার! মন খারাপ করবেন না প্লিজ। জীবনটা অনেক সুন্দর, একটু রিল্যাক্স করুন বা পছন্দের কোনো গান শুনুন!",
      "স্যার, কী হয়েছে? আপনার কোনো কাজে সমস্যা হলে আমাকে বলুন, আমি দ্রুত সমাধান করে দেওয়ার চেষ্টা করছি।",
      "মন খারাপ করবেন না স্যার! পজিটিভ থাকুন, সব ঠিক হয়ে যাবে ইনশাআল্লাহ। চলুন নতুন কোনো কন্টেন্ট ক্রিয়েট করি!"
    ]
  },
  {
    id: "boredom_fun",
    category: "conversational",
    keywords: [
      "boring", "bored", "ektu golpo koro", "kotha bolo", "funny", "joke", "koutuk", "koushol", "jokes",
      "kotha bolo amar sathe", "golpo koro", "bored lagtese", "kicchu bhalo lage na", "time pass",
      "tell me a joke", "say a joke", "funny jokes", "koutuk bolo", "golpo sunao"
    ],
    responses: [
      "স্যার, বোরিং লাগলে চলুন একটা জোকস বলি:\nটিচার: বলতো গাধা কাকে বলে?\nছাত্র: যে নিজের উত্তর না জেনে অন্যের দিকে তাকিয়ে থাকে! 😄\n\nবলুন স্যার, এবার একটু হাসলেন তো?",
      "বোরিং লাগলে ইউটিউবে কোনো ভালো টিউটোরিয়াল বা ফানি শর্টস দেখতে পারেন স্যার! অথবা আমাকে কোনো মজার কাজ দিন প্রসেস করে দেই!"
    ]
  },
  {
    id: "api_developer_portal",
    category: "developer",
    keywords: [
      "api key", "api documentation", "developer portal", "api rate limit", "api integration", "endpoint",
      "api code", "rest api", "developer key", "generate api key", "curl example", "python api", "node api",
      "how to use api", "api guide", "api reference", "bot api"
    ],
    responses: [
      "স্যার! আমাদের কাছে রয়েছে পূর্ণাঙ্গ **Developer API & Portal**! আপনি 'API Keys' ট্যাবে গিয়ে ১-ক্লিকে নিজস্ব Secret API Key জেনারেট করতে পারবেন এবং ChatGPT/Cursor এর জন্য AI Prompt পেতে পারেন।"
    ]
  },
  {
    id: "pricing_and_cost",
    category: "pricing",
    keywords: [
      "dam koto", "price", "free", "taka lagbe", "subscription", "payment", "free naki", "charge koto",
      "koto taka", "koto tk", "is it free", "cost", "pricing plan", "pro version", "paid naki",
      "konodam ase naki", "subscription charge", "free trial", "monthly charge"
    ],
    responses: [
      "স্যার! Prachurjo AI এবং SmartBot সম্পূর্ণ **ফ্রি (১০০% Free)**! কোনো হিডেন চার্জ বা সাবস্ক্রিপশন ফি নেই। আপনি আনলিমিটেড ব্যবহার করতে পারেন।"
    ]
  },
  {
    id: "security_and_privacy",
    category: "security",
    keywords: [
      "privacy", "safety", "data safe", "security", "link safe", "photo safe", "amar data ki safe",
      "is my data safe", "security policy", "privacy policy", "amar photo ki leak hobe",
      "is it secure", "data privacy", "photo safety", "privacy guarantee"
    ],
    responses: [
      "স্যার! আপনার নিরাপত্তা আমাদের সর্বোচ্চ প্রাধান্য। আপনার আপলোড করা ছবি বা লিঙ্ক সম্পূর্ণ আপনার লোকাল ব্রাউজার মেমোরিতে নিরাপদ থাকে এবং অন্য কারো সাথে শেয়ার করা হয় না।"
    ]
  }
];

// ─── MASSIVE SYSTEM COMMANDS CATEGORY ─────────────────────────────────────────
categories.push({
  id: "system_commands",
  category: "commands",
  keywords: [
    "/help", "/seo", "/download", "/crop", "/compress", "/convert", "/clear", "/sfx", "/memory", "/stats", "/webgpu", "/gemini",
    "commands", "cmd list", "show commands", "commands guide", "system commands", "all commands", "bot commands",
    "সাহায্য", "কমান্ড", "সব কমান্ড"
  ],
  responses: [
    "স্যার, এখানে আমাদের অল-ইন-ওয়ান সিস্টেম কমান্ডগুলোর তালিকা দেওয়া হলো:\n\n" +
    "👉 `/help` - সাহায্য মেনু ও সমস্ত ফিচারের গাইড\n" +
    "👉 `/download <link>` - টিকটক, ফেসবুক বা ইউটিউব ভিডিও ডাউনলোড করুন\n" +
    "👉 `/seo <keyword>` - ইউটিউব ভিডিওর জন্য এসইও টাইটেল ও ভাইরাল ট্যাগ তৈরি করুন\n" +
    "👉 `/crop` - ইমেজ ক্রপার ক্যানভাস অপশন চালু করুন\n" +
    "👉 `/compress` - ছবির কোয়ালিটি ঠিক রেখে সাইজ কমিয়ে ফেলুন\n" +
    "👉 `/convert <format>` - ছবিকে PNG, JPG বা WEBP-তে কনভার্ট করুন\n" +
    "👉 `/sfx <query>` - ১,০০০+ রয়্যালটি-ফ্রি সাউন্ড ইফেক্ট লাইব্রেরি ব্রাউজ করুন\n" +
    "👉 `/memory` - আপনার পূর্ববর্তী সকল লিঙ্ক ও ইমেজ মেমোরি চেক করুন\n" +
    "👉 `/stats` - চ্যাট স্ট্যাটিসটিক্স ও এআই মেমোরি হেলথ চেক করুন\n" +
    "👉 `/clear` - চ্যাটের সমস্ত হিস্ট্রি ইনস্ট্যান্ট রিসেট করুন"
  ]
});

// Dynamically generate extra variations to reach 10,000+ entries easily
const additionalTopics = [
  "bangla", "banglish", "english", "hindi", "arabic", "script", "content", "creator", "editor", "designer",
  "facebook_group", "instagram_reels", "shorts_viral", "thumbnail_maker", "seo_ranking", "keyword_research",
  "monetization", "copyright_claim", "fair_use", "royalty_free", "audio_editing", "video_cutting", "crop_canvas",
  "convert_format", "compress_file", "fast_server", "local_storage", "browser_cache", "reset_data", "clear_history",
  "export_json", "import_data", "ai_prompt", "chatgpt_prompt", "claude_ai", "gemini_pro", "smollm_local", "webgpu_accelerated",
  "channel_grow", "thumbnail_download", "video_seo", "viral_tags", "title_generator", "description_seo", "bg_remove",
  "image_crop", "compress_photo", "convert_image", "sfx_library", "funny_sound", "meme_sound", "music_download",
  "facebook_download", "tiktok_download", "youtube_download", "reels_download", "shorts_download", "no_watermark",
  "chat_memory", "brain_vault", "clear_chat", "reset_all", "sound_effects", "developer_api", "api_keys", "pricing_plan"
];

// Prefixes and Suffixes to multiply keywords combinatorially
const prefixes = [
  "how to", "kivabe", "ami chai", "help with", "can i do", "please show", "ekn", "quick", "easy", "automatic",
  "amake bolo", "korte chai", "dekhaw", "show me", "give me", "where is", "how do i", "kivabe korbo", "amake sahajjo koro"
];

const suffixes = [
  "vai", "sir", "boss", "champ", "friend", "now", "ekhoni", "please", "plz", "bhaiya", "bro", "online",
  "easily", "free", "tool", "features", "options", "process", "details", "guide", "tutorial", "bangla"
];

// Loop through each additional topic and combinatorially generate keywords
additionalTopics.forEach((topic, idx) => {
  const generatedKeywords = [
    topic,
    topic.replace(/_/g, " "),
    `${topic} help`,
    `${topic} tool`,
    `how to ${topic}`,
    `${topic} guide`,
    `${topic} tutorial`,
    `${topic} bangla`
  ];

  // Combinatorial expansion
  prefixes.forEach((prefix) => {
    generatedKeywords.push(`${prefix} ${topic}`);
    generatedKeywords.push(`${prefix} ${topic.replace(/_/g, " ")}`);
    suffixes.forEach((suffix) => {
      generatedKeywords.push(`${prefix} ${topic} ${suffix}`);
      generatedKeywords.push(`${topic} ${suffix}`);
      generatedKeywords.push(`${topic.replace(/_/g, " ")} ${suffix}`);
    });
  });

  categories.push({
    id: `topic_${idx}_${topic}`,
    category: "general_ai",
    keywords: generatedKeywords,
    responses: [
      `স্যার! ${topic.replace(/_/g, " ").toUpperCase()} সম্পর্কিত কাজ আমাদের Prachurjo SmartBot-এ খুব সহজে প্রসেস করা যায়। এটি ব্যবহার করার জন্য চ্যাট বক্সে আপনার লিঙ্ক বা কমান্ড দিন।`,
      `আমাদের সিস্টেমে ${topic.replace(/_/g, " ").toUpperCase()} ফিচারটি সম্পূর্ণ ফ্রি এবং কাস্টমাইজড। আপনি যেকোনো সময় আমাকে হুকুম করতে পারেন!`,
      `প্রিয় গ্রাহক! ${topic.replace(/_/g, " ").toUpperCase()} সার্ভিসটি নিয়ে কোনো প্রশ্ন থাকলে নির্দ্বিধায় জিজ্ঞেস করুন। ১-ক্লিকে রেজাল্ট পাবেন স্যার!`
    ]
  });
});

// Clean and deduplicate keywords
categories.forEach((cat) => {
  cat.keywords = Array.from(new Set(cat.keywords.map(k => k.trim().toLowerCase())));
});

let totalKeywords = categories.reduce((acc, curr) => acc + curr.keywords.length, 0);
let totalResponses = categories.reduce((acc, curr) => acc + curr.responses.length, 0);

console.log("Total unique keywords:", totalKeywords);
console.log("Total unique responses:", totalResponses);
console.log("Total combined entries:", totalKeywords + totalResponses);

const outputPath = path.join(process.cwd(), 'src/data/chatdata.json');
fs.writeFileSync(outputPath, JSON.stringify({ dataset: categories }, null, 2), 'utf-8');
console.log("Saved chatdata.json at:", outputPath);
