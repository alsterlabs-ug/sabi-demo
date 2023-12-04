// @ts-nocheck
import {
  Chip,
  Grid,
  Typography,
  Container,
  TextField,
  LinearProgress,
  Stack,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Slider,
} from "@mui/material";
import { Box } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import VideoJS from "../matny/components/VideoJS";
import * as JsSearch from "js-search";
import { format, formatDuration, intervalToDuration } from "date-fns";
import { itd } from "./client/[client]/sample/[sample]";
import Fuse from "fuse.js";
import _ from "lodash";

export default function Home() {
  const videoUrl = "uber-greater-mission";
  const [playerRef, setPlayerRef] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const videoJsOptions = {
    autoplay: true,
    muted: true,
    controls: false,
    loop: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: `./videos/${videoUrl}.mp4`,
        type: `video/mp4`,
      },
    ],
  };

  const handlePlayerReady = (player) => {
    player.on("loadedmetadata", () => {
      setPlayerRef(player);
    });
    player.on("waiting", () => {
      videojs.log("player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("player will dispose");
    });
    player.on("timeupdate", () => {
      // videojs.log("player timeupdate", player.currentTime());
      setCurrentTime(player.currentTime() * 1000);
    });
    player.on("ended", () => {
      videojs.log("player has ended");
    });
  };

  const { data: aIabTimelineIndexData } = useQuery(
    ["aIabTimelineIndexData"],
    () =>
      axios
        .get(`./videos/${videoUrl}/audio_iab_timeline_index.json`)
        .then((res) => res.data)
  );

  const { data: vIabTimelineIndexData } = useQuery(
    ["vIabTimelineIndexData"],
    () =>
      axios
        .get(`./videos/${videoUrl}/visual_iab_timeline_index.json`)
        .then((res) => res.data)
  );

  const { data: aTextTimelineData } = useQuery(["aTextTimelineData"], () =>
    axios
      .get(`./videos/${videoUrl}/audio_text_timeline.json`)
      .then((res) => res.data)
  );
  const { data: aTextTimelineIndexData } = useQuery(
    ["aTextTimelineIndexData"],
    () =>
      axios
        .get(`./videos/${videoUrl}/audio_text_timeline_index.json`)
        .then((res) => res.data)
  );

  const { data: vTextTimelineData } = useQuery(["vTextTimelineData"], () =>
    axios
      .get(`./videos/${videoUrl}/visual_text_timeline.json`)
      .then((res) => res.data)
  );

  const { data: objectTimelineIndexData } = useQuery(
    ["objectTimelineIndexData"],
    () =>
      axios
        .get(`./videos/${videoUrl}/object_timeline_index.json`)
        .then((res) => res.data)
  );

  const { data: visualSegmentTimelineData } = useQuery(
    ["visualSegmentTimelineData"],
    () =>
      axios
        .get(`./videos/${videoUrl}/visual_segment_timeline.json`)
        .then((res) => res.data)
  );

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

  objectTimelineIndexData &&
    Object.keys(objectTimelineIndexData)?.forEach((item) => {
      searchContents.push(objectTimelineIndexData[item]);
    });

  const fuse = new Fuse(_.uniq(searchContents), {
    shouldSort: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    matchAllTokens: true,
    includeScore: true,
    maxPatternLength: 32,
    minMatchCharLength: 5,
    keys: ["item"],
  });
  const [searchStr, setSearchStr] = useState("");
  const [searchRes, setSearchRes] = useState([]);

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

  const [options, setOptions] = useState(true);
  const [iabTimeline, setIabTimeline] = useState(false);
  const [textTimeline, setTextTimeline] = useState(false);
  const [objectTimeline, setObjectTimeline] = useState(false);
  const [segmentTimeline, setSegmentTimeline] = useState(false);

  return (
    <>
      <Head>
        <title>SceneContext</title>
        <meta name="description" content="Matny scene context" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container sx={{ minHeight: 2000 }}>
        <h1>SceneContext (WIP 🚧)</h1>
        <Grid container>
          <Grid item xs={8}>
            <Box
              onClick={() => {
                playerRef.paused() ? playerRef.play() : playerRef.pause();
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
          <Grid item xs={4} sx={{ paddingLeft: 2, paddingTop: 2 }}>
            {playerRef && (
              <Typography>{`Duration - ${playerRef.duration()}s`}</Typography>
            )}
            {options && (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={iabTimeline}
                      onChange={() => {
                        setIabTimeline(!iabTimeline);
                      }}
                      name="iabTimeline"
                    />
                  }
                  label="Show Ad Recommendations"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={textTimeline}
                      onChange={() => {
                        setTextTimeline(!textTimeline);
                      }}
                      name="textTimeline"
                    />
                  }
                  label="Show Text timeline"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={objectTimeline}
                      onChange={() => {
                        setObjectTimeline(!objectTimeline);
                      }}
                      name="objectTimeline"
                    />
                  }
                  label="Show Object timeline"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={segmentTimeline}
                      onChange={() => {
                        setSegmentTimeline(!segmentTimeline);
                      }}
                      name="segmentTimeline"
                    />
                  }
                  label="Show Segment timeline"
                />
              </>
            )}

            {iabTimeline && (
              <>
                <Typography sx={{ marginTop: 2 }}>
                  Audio iab timeline
                </Typography>
                {aIabTimelineIndexData &&
                  Object.keys(aIabTimelineIndexData).map((item, index) => {
                    const isCurrent = aIabTimelineIndexData[item]?.periods
                      ?.map(
                        (period) =>
                          currentTime >= period.startMs &&
                          currentTime <= period.endMs
                      )
                      ?.includes(true);
                    return (
                      isCurrent && (
                        <Chip
                          sx={{ marginRight: 1, marginBottom: 1 }}
                          key={index}
                          label={aIabTimelineIndexData[item]?.item}
                          size="small"
                        />
                      )
                    );
                  })}
                <Typography sx={{ marginTop: 2 }}>
                  Video iab timeline
                </Typography>
                {vIabTimelineIndexData &&
                  Object.keys(vIabTimelineIndexData).map((item, index) => {
                    const isCurrent = vIabTimelineIndexData[item]?.periods
                      ?.map(
                        (period) =>
                          currentTime >= period.startMs &&
                          currentTime <= period.endMs
                      )
                      ?.includes(true);
                    return (
                      isCurrent && (
                        <Chip
                          sx={{ marginRight: 1, marginBottom: 1 }}
                          key={index}
                          label={vIabTimelineIndexData[item]?.item}
                          size="small"
                        />
                      )
                    );
                  })}
              </>
            )}
            {textTimeline && (
              <>
                <Typography sx={{ marginTop: 2 }}>
                  Audio text timeline
                </Typography>

                {aTextTimelineData &&
                  aTextTimelineData.map((period, index) => {
                    const isCurrent =
                      currentTime >= period.startMs &&
                      currentTime <= period.endMs;
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
                <Typography sx={{ marginTop: 2 }}>
                  Video text timeline
                </Typography>
                {vTextTimelineData &&
                  vTextTimelineData.map((period, index) => {
                    const isCurrent =
                      currentTime >= period.startMs &&
                      currentTime <= period.endMs;
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
            )}
            {objectTimeline && (
              <>
                <Typography sx={{ marginTop: 2 }}>Object timeline</Typography>
                {objectTimelineIndexData &&
                  Object.keys(objectTimelineIndexData).map((item, index) => {
                    const isCurrent = objectTimelineIndexData[item]?.periods
                      ?.map(
                        (period) =>
                          currentTime >= period.startMs &&
                          currentTime <= period.endMs
                      )
                      ?.includes(true);
                    return (
                      isCurrent && (
                        <Chip
                          sx={{ marginRight: 1, marginBottom: 1 }}
                          key={index}
                          label={objectTimelineIndexData[item]?.item}
                          size="small"
                        />
                      )
                    );
                  })}
              </>
            )}
            {segmentTimeline && (
              <>
                <Typography sx={{ marginTop: 2 }}>
                  Visual segment timeline
                </Typography>
                {visualSegmentTimelineData &&
                  visualSegmentTimelineData.map((period, index) => {
                    const isCurrent =
                      currentTime >= period.startMs &&
                      currentTime <= period.endMs;
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
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export const WrapperLinearProgress = ({
  playerRef,
  searchRes,
  ...props
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    playerRef?.on("timeupdate", () => {
      setCurrentTime(playerRef.currentTime());
    });
    playerRef?.on("seeked", () => {
      setUpdateProgress(false);
    });
  }, [playerRef]);

  const [updateProgress, setUpdateProgress] = useState(false);
  const [pValue, setPValue] = useState(false);

  useEffect(() => {
    const progress = (currentTime / playerRef.duration()) * 100;
    setProgressValue(progress);
  }, [currentTime]);

  const handleChange = (event: Event, newValue: number | number[]) => {
    setPValue(newValue);
    setUpdateProgress(true);
  };
  const handleChangeCommitted = (event: Event, newValue: number | number[]) => {
    playerRef.currentTime(playerRef.duration() * (newValue / 100));
  };

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <Typography sx={{ marginTop: 0.25 }}>{itd(currentTime)}</Typography>
        <Box
          sx={{
            flexGrow: 1,
            paddingLeft: 2,
            paddingRight: 2,
            position: "relative",
          }}
        >
          <Slider
            size="small"
            aria-label="progress"
            value={updateProgress ? pValue : progressValue}
            onChange={handleChange}
            onChangeCommitted={handleChangeCommitted}
          />
          {/* @ts-ignore */}
          {searchRes?.map((item, index) => {
            return item.periods.map((period, index) => {
              return (
                <Tooltip title={item.item} key={index}>
                  <Box
                    sx={{
                      backgroundColor: `#fdaa4790`,
                      marginLeft: `${
                        (period.startMs / (playerRef.duration() * 1000)) * 100
                      }%`,
                      borderRadius: 2,
                      width: `${
                        ((period.endMs - period.startMs) /
                          (playerRef.duration() * 1000)) *
                        100
                      }%`,
                      minWidth: 16,
                      height: 10,
                      marginTop: 1,
                    }}
                    onClick={(e) => {
                      playerRef.currentTime(period.startMs / 1000);
                    }}
                  />
                </Tooltip>
              );
            });
          })}
        </Box>
        <Typography sx={{ marginTop: 0.25 }}>{itd(playerRef.duration())}</Typography>
      </Box>
    </>
  );
};
