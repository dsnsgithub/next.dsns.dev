// pages/api/tiktok.ts

import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

interface TikTokItem {
  id: string;
  author: {
    uniqueId: string;
  };
  video: {
    cover: string;
  };
}

interface TikTokResponse {
  itemList?: TikTokItem[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { musicID, cursor = "0" } = req.query;
    
    const response = await axios.get("https://www.tiktok.com/api/music/item_list/", {
      params: {
        aid: 1988,
        count: 30,
        cursor,
        musicID,
        device_id: "7081889228408063534"
      }
    });

    const data = response.data as TikTokResponse;

    if (!data?.itemList) {
      return res.status(200).json({ success: true, data: [] });
    }

    const formattedData = data.itemList
      .filter((item): item is TikTokItem => !!(item.author?.uniqueId && item.id))
      .map((item) => ({
        url: `https://www.tiktok.com/@${item.author.uniqueId}/video/${item.id}`,
        coverImage: item.video?.cover || ""
      }));

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error fetching data from TikTok API:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
