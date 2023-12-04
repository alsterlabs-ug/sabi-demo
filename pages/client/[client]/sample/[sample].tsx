// @ts-nocheck

import {
  Chip,
  Grid,
  Typography,
  Container,
  Box,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  TextField,
} from "@mui/material";
import axios from "axios";
import _ from "lodash";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { WrapperLinearProgress } from "../../..";
import { SampleSelect } from "../../[client]";
import videojs from "video.js";
import VideoJS from "../../../../matny/components/VideoJS";
import { intervalToDuration } from "date-fns";
import Fuse from "fuse.js";

export const itd = (duration) => {
  const formattedDuration = intervalToDuration({
    start: 0,
    end: duration * 1000,
  });
  return `${formattedDuration.hours}:${formattedDuration.minutes}:${formattedDuration.seconds}`;
};

export async function getServerSideProps({
  params,
}: GetServerSidePropsContext) {
  if (!params?.client || !params?.sample) {
    return {
      props: {
        client: null,
        sample: null,
      },
    };
  }

  const client = await axios.post(`${process.env.API_PREFIX}/api/s3`, {
    path: `${params.client}/scanned_media`,
  });

  const samples = await axios.post(`${process.env.API_PREFIX}/api/s3`, {
    path: `${params.client}/samples`,
    getSignedUrls: true,
  });

  const sample = await axios.post(`${process.env.API_PREFIX}/api/s3`, {
    path: `${params.client}/scanned_media/${params.sample}`,
    getSignedUrls: true,
  });

  let aIabTimelineIndexData = null;
  let aTextTimelineData = null;
  let vTextTimelineData = null;
  let objTimelineIndexData = null;
  let vIabTimelineIndexData = null;
  let vSegmentTimelineData = null;
  let aTextTimelineIndexData = null;
  let moderationTimelineIndexData = null;
  let celebTimelineIndexData = null;
  let audioSentimentTimelineIndexData = null;
  const { Contents: sampleContents } = sample.data;

  for await (const content of sampleContents) {
    const aIabTimelineIndex = `${params.client}/scanned_media/${params.sample}/audio_iab_timeline_index.json`;
    const vIabTimelineIndex = `${params.client}/scanned_media/${params.sample}/visual_iab_timeline_index.json`;
    const aTextTimeline = `${params.client}/scanned_media/${params.sample}/audio_text_timeline.json`;
    const vTextTimeline = `${params.client}/scanned_media/${params.sample}/visual_text_timeline.json`;
    const objTimelineIndex = `${params.client}/scanned_media/${params.sample}/object_timeline_index.json`;
    const vSegmentTimeline = `${params.client}/scanned_media/${params.sample}/visual_segment_timeline.json`;
    const aTextTimelineIndex = `${params.client}/scanned_media/${params.sample}/audio_text_timeline_index.json`;
    const moderationTimelineIndex = `${params.client}/scanned_media/${params.sample}/moderation_timeline_index.json`;
    const celebTimelineIndex = `${params.client}/scanned_media/${params.sample}/celeb_timeline_index.json`;
    const audioSentimentTimelineIndex = `${params.client}/scanned_media/${params.sample}/audio_sentiment_timeline_index.json`;
    if (
      content.Key === aIabTimelineIndex ||
      content.Key === vIabTimelineIndex ||
      content.Key === aTextTimeline ||
      content.Key === vTextTimeline ||
      content.Key === objTimelineIndex ||
      content.Key === vSegmentTimeline ||
      content.Key === aTextTimelineIndex ||
      content.Key === moderationTimelineIndex || 
      content.Key === celebTimelineIndex ||
      content.Key === audioSentimentTimelineIndex
    ) {
      const res = await axios.post(`${process.env.API_PREFIX}/api/s3`, {
        signedUrl: content.signedUrl,
      });
      if (res?.data && content.Key === aIabTimelineIndex)
        aIabTimelineIndexData = res.data;
      if (res?.data && content.Key === vIabTimelineIndex)
        vIabTimelineIndexData = res.data;
      if (res?.data && content.Key === aTextTimeline)
        aTextTimelineData = res.data;
      if (res?.data && content.Key === vTextTimeline)
        vTextTimelineData = res.data;
      if (res?.data && content.Key === objTimelineIndex)
        objTimelineIndexData = res.data;
      if (res?.data && content.Key === vSegmentTimeline)
        vSegmentTimelineData = res.data;
      if (res?.data && content.Key === aTextTimelineIndex)
        aTextTimelineIndexData = res.data;
      if (res?.data && content.Key === moderationTimelineIndex)
        moderationTimelineIndexData = res.data;
      if (res?.data && content.Key === celebTimelineIndex)
        celebTimelineIndexData = res.data;
      if (res?.data && content.Key === audioSentimentTimelineIndex)
        audioSentimentTimelineIndexData = res.data;
    }
  }

  return {
    props: {
      client: client.data,
      clientSlug: params.client,
      samples: samples.data,
      sample: sample.data,
      sampleSlug: params.sample,
      aIabTimelineIndexData,
      vIabTimelineIndexData,
      aTextTimelineData,
      vTextTimelineData,
      objTimelineIndexData,
      vSegmentTimelineData,
      moderationTimelineIndexData,
      celebTimelineIndexData,
      audioSentimentTimelineIndexData,
    },
  };
}

export default function Sample({ ...restProps }) {
  const router = useRouter();
  const [playerRef, setPlayerRef] = useState(null);
  const [searchStr, setSearchStr] = useState("");
  const [searchRes, setSearchRes] = useState([]);
  const [iabTimeline, setIabTimeline] = useState(false);
  const [textTimeline, setTextTimeline] = useState(false);
  const [objTimeline, setObjTimeline] = useState(false);
  const [segmentTimeline, setSegmentTimeline] = useState(false);
  const [moderationTimeline, setModerationTimeline] = useState(false);
  const [celebTimeline, setCelebTimeline] = useState(false);
  const [audioSentimentTimeline, setAudioSentimentTimeline] = useState(false);
  const [loading, setLoading] = useState(false);

  if (restProps?.client === null || restProps?.sample === null)
    return (
      <Container sx={{ minHeight: 2000 }}>
        <h1>Sample not found</h1>
      </Container>
    );

  const {
    client,
    clientSlug,
    samples,
    sample,
    sampleSlug,
    aIabTimelineIndexData,
    vIabTimelineIndexData,
    aTextTimelineData,
    vTextTimelineData,
    objTimelineIndexData,
    vSegmentTimelineData,
    aTextTimelineIndexData,
    moderationTimelineIndexData,
    celebTimelineIndexData,
    audioSentimentTimelineIndexData,
  } = restProps;

  const searchContents = [];
  aIabTimelineIndexData &&
    Object.keys(aIabTimelineIndexData)?.forEach((item) => {
      searchContents.push(aIabTimelineIndexData[item]);
    });

  vIabTimelineIndexData &&
    Object.keys(vIabTimelineIndexData)?.forEach((item) => {
      searchContents.push(vIabTimelineIndexData[item]);
    });

  aTextTimelineIndexData &&
    Object.keys(aTextTimelineIndexData)?.forEach((item) => {
      searchContents.push(aTextTimelineIndexData[item]);
    });

  objTimelineIndexData &&
    Object.keys(objTimelineIndexData)?.forEach((item) => {
      searchContents.push(objTimelineIndexData[item]);
    });

  moderationTimelineIndexData &&
    Object.keys(moderationTimelineIndexData)?.forEach((item) => {
      searchContents.push(moderationTimelineIndexData[item]);
    });

  celebTimelineIndexData &&
    Object.keys(celebTimelineIndexData)?.forEach((item) => {
      searchContents.push(celebTimelineIndexData[item]);
    });

  audioSentimentTimelineIndexData &&
    Object.keys(audioSentimentTimelineIndexData)?.forEach((item) => {
      searchContents.push(audioSentimentTimelineIndexData[item]);
    });

  const fuse = new Fuse(_.uniq(searchContents), {
    threshold: 0.2,
    keys: ["item"],
  });

  const { CommonPrefixes } = restProps?.client;
  const { Contents: samplesContents } = restProps?.samples;

  const videoJsOptions = {
    autoplay: true,
    muted: false,
    controls: false,
    loop: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: (() => {
          let videoUrl = "";

          for (const sample of samplesContents) {
            // prettier-ignore
            const keyWithoutSlug = _.replace(sample.Key, `${clientSlug}/samples/`, "");
            const keyWithoutExt = _.replace(keyWithoutSlug, ".mp4", "");
            if (keyWithoutExt === sampleSlug) {
              videoUrl = sample.signedUrl;
              break;
            }
          }
          return videoUrl;
        })(),
        type: `video/mp4`,
      },
    ],
  };

  const handlePlayerReady = (player) => {
    player.on("loadedmetadata", () => {
      setPlayerRef(player);
    });
    player.on("waiting", () => {
      console.log("waiting");
    });
    player.on("play", () => {
      console.log("play");
    });
    player.on("seeking", () => {
      console.log("seeking");
    });
    player.on("seeked", () => {
      console.log("seeked");
    });
    player.on("waiting", () => {
      videojs.log("player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("player will dispose");
    });
    player.on("timeupdate", () => {
      // videojs.log("player timeupdate", player.currentTime());
    });
    player.on("ended", () => {
      videojs.log("player has ended");
    });
  };

  const handleOnChange = (e) => {
    setSearchStr(e.target.value);
    if (e.target.value.length >= 3) {
      const search = fuse.search(e.target.value);
      const searchRes = search.map((item) => item.item);
      setSearchRes(searchRes);
    } else {
      setSearchRes([]);
    }
  };

  return (
    <Container sx={{ minHeight: 2000 }}>
      <h1>{_.startCase(restProps.clientSlug)} /</h1>
      <Box sx={{ display:'flex', flexDirection: 'row', alignItems: 'center' }}>
        <SampleSelect
          CommonPrefixes={CommonPrefixes}
          preselected={`${restProps.clientSlug}/scanned_media/${restProps.sampleSlug}/`}
          handleChange={(value: string) => {
            const name = value;
            // prettier-ignore
            const sampleName = _.replace(name, `${restProps.clientSlug}/scanned_media/`, "");
            setLoading(true);
            router
              .push(`/client/${restProps.clientSlug}/sample/${sampleName}`)
              .then(() => window.location.reload());
          }}
        />
        <Box sx={{ marginLeft: 1 }}>
          <>
            {playerRef && <Typography>{`Duration - ${itd(playerRef.duration())}`}</Typography>}
            {playerRef && <CurrentSec playerRef={playerRef} />}
          </>
        </Box>
        {loading && <CircularProgress sx={{ marginLeft: 1 }} />}
      </Box>
      <Grid container sx={{ marginTop: 2 }}>
        <Grid item xs={8}>
          <Box
            onClick={() => {
              playerRef?.paused() ? playerRef?.play() : playerRef?.pause();
            }}
          >
            <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
          </Box>
          <Box
            sx={{
              marginTop: 2,
              width: `${(2 / 3) * 100}%`,
            }}
          >
            <TextField
              label="Search field"
              type="search"
              onChange={handleOnChange}
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              helperText={
                searchStr === ""
                  ? "Search for a scene"
                  : searchStr.length < 3
                  ? "Too short"
                  : ""
              }
              sx={{ marginRight: 2 }}
            />
          </Box>
          <Box sx={{ marginTop: 2 }}>
            {playerRef && (
              <WrapperLinearProgress
                playerRef={playerRef}
                searchRes={searchRes}
              />
            )}
          </Box>
        </Grid>
        <Grid item xs={4} sx={{ paddingLeft: 2 }}>
          <Box sx={{ border: "1px solid #00000050", borderRadius: 1, padding: 1 }}>
            <Box sx={{ position: 'relative' }}>
              <Typography sx={{ position: 'absolute', left: '16px', top: "-28px", background: 'white', padding: 1 }}>Show Data</Typography>
            </Box>
            <StyledCheckBox
              label="People"
              checked={celebTimeline}
              handleOnChange={() => setCelebTimeline(!celebTimeline)}
            />
            <StyledCheckBox
              label="Sentiment"
              checked={audioSentimentTimeline}
              handleOnChange={() => setAudioSentimentTimeline(!audioSentimentTimeline)}
            />
            <StyledCheckBox
              label="Ad Recommendations"
              checked={iabTimeline}
              handleOnChange={() => setIabTimeline(!iabTimeline)}
            />
            <StyledCheckBox
              label="Texts"
              checked={textTimeline}
              handleOnChange={() => setTextTimeline(!textTimeline)}
            />
            <StyledCheckBox
              label="Keywords"
              checked={objTimeline}
              handleOnChange={() => setObjTimeline(!objTimeline)}
            />
            <StyledCheckBox
              label="Show Segment timeline"
              checked={segmentTimeline}
              handleOnChange={() => setSegmentTimeline(!segmentTimeline)}
            />
            <StyledCheckBox
              label="Not safe for work"
              checked={moderationTimeline}
              handleOnChange={() => setModerationTimeline(!moderationTimeline)}
            />
          </Box>
          {playerRef && celebTimeline && (
            <KeyTimeline
              playerRef={playerRef}
              data={celebTimelineIndexData}
              label={"People"}
              marginTop={1}
            />
          )}
          {playerRef && audioSentimentTimeline && (
            <KeyTimeline
              playerRef={playerRef}
              data={audioSentimentTimelineIndexData}
              label={"Audio Sentiment"}
              marginTop={1}
            />
          )}
          {playerRef && iabTimeline && (<Typography sx={{ marginTop: 2 }}>Ad Recommendations</Typography>)}
          {playerRef && iabTimeline && (
            <KeyTimeline
              playerRef={playerRef}
              data={aIabTimelineIndexData}
              label={"Based on audio"}
              marginTop={1}
            />
          )}
          {playerRef && iabTimeline && (
            <KeyTimeline
              playerRef={playerRef}
              data={vIabTimelineIndexData}
              label={"Based on video"}
              marginTop={1}
            />
          )}
          {playerRef && textTimeline && (
            <TextTimeline
              playerRef={playerRef}
              data={aTextTimelineData}
              label={"Audio to text"}
            />
          )}
          {playerRef && textTimeline && (
            <TextTimeline
              playerRef={playerRef}
              data={vTextTimelineData}
              label={"Text in video"}
            />
          )}
          {playerRef && objTimeline && (
            <KeyTimeline
              playerRef={playerRef}
              data={objTimelineIndexData}
              label={"Keywords"}
            />
          )}
          {playerRef && segmentTimeline && (
            <ItemTimeline
              playerRef={playerRef}
              data={vSegmentTimelineData}
              label={"Video Segement timeline"}
            />
          )}
          {playerRef && moderationTimeline && (
            <KeyTimeline
              playerRef={playerRef}
              data={moderationTimelineIndexData}
              label={"Not safe for work"}
            />
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

const StyledCheckBox = ({ checked, handleOnChange, label, ...restProps }) => {
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          onChange={handleOnChange}
          name="objTimeline"
        />
      }
      label={label}
    />
  );
};

const KeyTimeline = ({
  playerRef,
  data,
  label = "IAB Timeline",
  ...restProps
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    playerRef?.on("timeupdate", () =>
      setCurrentTime(playerRef.currentTime() * 1000)
    );
  }, [playerRef]);
  return (
    <>
      <Typography sx={{ marginTop: restProps?.marginTop ?? 2 }}>{label}</Typography>
      {!data && <div>not loaded</div>}
      {data &&
        Object.keys(data).map((item, index) => {
          const isCurrent = data[item]?.periods
            ?.map(
              (period) =>
                currentTime >= period.startMs && currentTime <= period.endMs
            )
            ?.includes(true);
          return (
            isCurrent && (
              <Chip
                sx={{ marginRight: 1, marginBottom: 1 }}
                key={index}
                label={data[item]?.item}
                size="small"
              />
            )
          );
        })}
    </>
  );
};

const TextTimeline = ({
  playerRef,
  data,
  label = "Text timline",
  ...restProps
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    playerRef?.on("timeupdate", () =>
      setCurrentTime(playerRef.currentTime() * 1000)
    );
  }, [playerRef]);
  return (
    <>
      <Typography sx={{ marginTop: 2 }}>{label}</Typography>
      {!data && <div>No data</div>}
      {data &&
        data.map((period, index) => {
          const isCurrent =
            currentTime >= period.startMs && currentTime <= period.endMs;

          return (
            isCurrent && (
              <Chip
                sx={{ marginRight: 1, marginBottom: 1 }}
                key={index}
                label={period.text}
                size="small"
              />
            )
          );
        })}
    </>
  );
};

const ItemTimeline = ({
  playerRef,
  data,
  label = "Text timline",
  ...restProps
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    playerRef?.on("timeupdate", () =>
      setCurrentTime(playerRef.currentTime() * 1000)
    );
  }, [playerRef]);
  return (
    <>
      <Typography sx={{ marginTop: 2 }}>{label}</Typography>
      {!data && <div>No data</div>}
      {data &&
        data.map((period, index) => {
          const isCurrent =
            currentTime >= period.startMs && currentTime <= period.endMs;
          return (
            isCurrent && (
              <Chip
                sx={{ marginRight: 1, marginBottom: 1 }}
                key={index}
                label={period?.item?.type}
                size="small"
              />
            )
          );
        })}
    </>
  );
};

const CurrentSec = ({ playerRef, ...restProps }) => {
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    playerRef?.on("timeupdate", () => setCurrentTime(playerRef.currentTime()));
  }, [playerRef]);
  return <Typography>{`Current time(s) - ${currentTime}`}</Typography>;
};
