import { config } from "dotenv";
import fetch from "node-fetch";
import gis from "g-i-s";
import Discord, {
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
} from "discord.js";
import { translate } from "@vitalets/google-translate-api";

// Load environment variables from a .env file
config();

if (config.error) {
  console.log("Cannot find a dotenv file. Exiting...");
  process.exit(0);
}

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

async function handleTranslationCommand(message) {
  const textToTranslate = message.content.slice(11).trim();
  if (!textToTranslate) {
    message.channel.send(
      "Please provide text to translate. Example: ./translate Hello, world"
    );
    return;
  }

  try {
    const translatedText = await translateText(textToTranslate);
    const translatedMessage = new EmbedBuilder()
      .setTitle(`Translated text`)
      .addFields(
        { name: "Original text", value: textToTranslate, inline: false },
        { name: "Translated Text", value: translatedText, inline: false }
      );
    message.channel.send({ embeds: [translatedMessage] });
  } catch (error) {
    console.error("Error:", error);
    message.channel.send("An error occurred while translating the text.");
  }
}

async function translateText(txt) {
  try {
    console.log(txt);
    const { text } = await translate(txt+' 😍', { to: "as" });
    console.log("Translated text bop:", text);
    return text;
  } catch (error) {
    console.error("Error translating text:", error);
    throw error;
  }
}

/**
 * @param {Discord.Message} message
 */
async function getSong(message) {
  try {
    const response = await fetch(
      `https://youtube.googleapis.com/youtube/v3/search?part=id&part=snippet&q=zubeengarghindisong&safeSearch=strict&key=${YOUTUBE_API_KEY}`
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.items.length);
      const randomVideoId = data.items[randomIndex].id.videoId;
      const youtubeLink = `https://www.youtube.com/watch?v=${randomVideoId}`;

      message.channel.send(youtubeLink);
    } else {
      message.channel.send("No videos found.");
    }
  } catch (error) {
    console.error("Error fetching videos:", error);
    message.channel.send("Failed to fetch videos.");
  }
}

/**
 * @param {Discord.Message} message
 */

async function getWeather(message) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Assam&appid=${WEATHER_API_KEY}&units=metric`
    );
    const data = await response.json();

    if (data.cod === 200) {
      const temperature = data.main.temp;
      const description = data.weather[0].description.replace(
        /\b\w/g,
        (match) => match.toUpperCase()
      );
      const humidity = data.main.humidity;

      const weatherIcon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

      const weatherMessage = new EmbedBuilder()
        .setTitle(`Weather in Assam`)
        .addFields(
          { name: "Temperature", value: `${temperature}°C`, inline: true },
          { name: "Description", value: description, inline: true },
          { name: "Humidity", value: `${humidity}%`, inline: true }
        )
        .setThumbnail(weatherIcon); 
      message.channel.send({ embeds: [weatherMessage] });
    } else {
      message.channel.send("Unable to fetch weather data for Assam.");
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
    message.channel.send("Failed to fetch weather data for Assam.");
  }
}

/**
 * @param {Discord.Message} message
 */
async function GetNews(message) {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=Assam&apiKey=${NEWS_API_KEY}`
    );
    const newsData = await response.json();

    if (newsData.articles && newsData.articles.length > 0) {
      const randomIndex = Math.floor(Math.random() * newsData.articles.length);
      const randomArticle = newsData.articles[randomIndex];
      message.channel.send(`${randomArticle.title}\n${randomArticle.url}`);
    } else {
      message.channel.send("No news articles found for Assam.");
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    message.channel.send("Failed to fetch news.");
  }
}

client.on("ready", (c) => {
  console.log(`${c.user.tag} has logged in.`);
});

client.login(DISCORD_BOT_TOKEN);

client.on("messageCreate", (message) => {
  let tokens = message.content.split(" ");

  if (tokens.length > 0) {
    if (message.author.bot) return;
    if (tokens[0].toLowerCase() === "hello") {
      message.channel.send("Hello, I am your Discord bot!");
    } else if (tokens[0].toLowerCase() === "help") {
      message.channel.send('Send "./hemlp" for hemlp.');
    } else if (tokens[0].toLowerCase() === "./hemlp") {
      message.channel.send(
        "Commands:\n" +
          "./gif to show gifs\n" +
          "./img to show images\n" +
          "./play to play YouTube video\n" +
          "./dadjoke for a dadjoke 👀\n" +
          "./meme for a meme from r/memes"
      );
    } else if (tokens[0].toLowerCase() === "./news") {
      GetNews(message);
    } else if (tokens[0].toLowerCase() === "./weather") {
      getWeather(message);
    } else if (tokens[0].toLowerCase() === "./songs") {
      getSong(message);
    } else if (tokens[0].toLowerCase() === "./translate") {
      handleTranslationCommand(message);
    }
  }
});

console.log("Starting...");
