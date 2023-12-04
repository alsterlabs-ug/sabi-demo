import {
  Grid,
  Typography,
  Container,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputLabel,
  CircularProgress,
  Box,
} from "@mui/material";
import axios from "axios";
import _ from "lodash";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

export async function getServerSideProps({
  params,
}: GetServerSidePropsContext) {
  if (!params?.client) {
    return {
      props: {
        client: null,
      },
    };
  }
  const res = await axios.post(`${process.env.API_PREFIX}/api/s3`, {
    path: `${params.client}/scanned_media`,
  });

  // console.log(res.data);
  return {
    props: {
      clientSlug: params.client,
      client: res.data,
    },
  };
}

export default function Client({ ...restProps }) {
  const router = useRouter();
  const { CommonPrefixes } = restProps?.client;
  const [loading, setLoading] = useState(false);
  if (restProps?.client === null) return <Typography>Client not found</Typography>;

  return (
    <Container sx={{ minHeight: 2000 }}>
      <h1>SceneContext - {_.startCase(restProps.clientSlug)}</h1>
      <SampleSelect
        CommonPrefixes={CommonPrefixes}
        handleChange={(value: string) => {
          const name = value;
          // prettier-ignore
          const sampleName = _.replace(name, `${restProps.clientSlug}/scanned_media/`, "");
          setLoading(true);
          router.push(`/client/${restProps.clientSlug}/sample/${sampleName}`);
        }}
      />
      {loading && (
        <CircularProgress sx={{ marginLeft: 1, marginTop: 1 }}/>
      )}
      <Grid container></Grid>
    </Container>
  );
}

// @ts-ignore
export const SampleSelect = ({
  CommonPrefixes = [],
  preselected = "",
  ...restProps
}) => {
  const [selected, setSelected] = useState(preselected);
  return (
    <FormControl sx={{ minWidth: 233 }}>
      <InputLabel id="demo-simple-select-label">Select a sample</InputLabel>
      <Select
        value={selected}
        onChange={(event: SelectChangeEvent) => {
          setSelected(event.target.value);
          restProps.handleChange(event.target.value);
        }}
        displayEmpty
        label="Select a video"
      >
        {CommonPrefixes &&
          CommonPrefixes.map((item: any, index: number) => {
            return (
              <MenuItem value={item.Prefix} key={index}>
                {_.replace(item.Prefix, "/scanned_media/", "/sample/")}
              </MenuItem>
            );
          })}
      </Select>
    </FormControl>
  );
};
