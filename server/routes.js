const { MONGO_URL } = require("./const/mongodb");
const { MongoClient, ObjectId } = require("mongodb");

const mongoClient = new MongoClient(MONGO_URL);

export const handleGetRequest = async (req, res) => {
  return res.status(201).json({ msg: "good work" })
};

export const handleLoginRequest = async (req, res) => {
  const { nickname, password } = req.body;

  try {
    await mongoClient.connect();
    const chessDb = mongoClient.db("chess");

    const isUser = await chessDb
      .collection("user")
      .findOne({ nickname: nickname + "," + password });
    if (isUser) {
      return res.status(201).json({ msg: "good", data: isUser });
    } else {
      const result = await chessDb
        .collection("user")
        .insertOne({ nickname: nickname + "," + password, win: 0, lose: 0 });
      const data = {
        _id: result.insertedId,
        nickname: nickname + "," + password,
        win: 0,
        lose: 0,
      };
      return res.status(201).json({ msg: "good", data });
    }
  } catch (err) {
    return res.status(500).json({ msg: "Internal Server Error" });
  } finally {
    await mongoClient.close();
  }
};

export const handleGameResult = async (req, res) => {
  const { _id, isWin } = req.body;
  const objectId = new ObjectId(_id);

  try {
    await mongoClient.connect();
    const chessDb = mongoClient.db("chess");

    const isUser = await chessDb.collection("user").findOne({ _id: objectId });
    if (isUser) {
      let update;
      if (isWin) {
        update = { $inc: { win: 1 } };
      } else {
        update = { $inc: { lose: 1 } };
      }
      await chessDb.collection("user").updateOne({ _id: objectId }, update);
      const data = await chessDb.collection("user").findOne({ _id: objectId });
      return res.status(201).json({ msg: "good", data });
    } else {
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  } catch (err) {
    return res.status(500).json({ msg: "Internal Server Error" });
  } finally {
    await mongoClient.close();
  }
};

// export default {
//   handleGetRequest,
//   handleLoginRequest,
//   handleGameResult,
// };
