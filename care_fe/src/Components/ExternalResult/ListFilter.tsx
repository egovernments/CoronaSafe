import React, { useEffect, useState } from "react";
import { AutoCompleteAsyncField } from "../Common/HelperInputFields";
import { getAllLocalBody } from "../../Redux/actions";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "raviger";

export default function ListFilter(props: any) {
  let { filter, onChange, closeFilter } = props;
  const [wardList, setWardList] = useState<any[]>([]);
  const [lsgList, setLsgList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [wards, setWards] = useState<any[]>([]);
  const [selectedLsds, setSelectedLsgs] = useState<any[]>([]);
  const dispatch: any = useDispatch();
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const handleWardChange = (value: any) => {
    setWards(value);
  };
  const handleLsgChange = (value: any) => {
    setSelectedLsgs(value);
  };

  const applyFilter = () => {
    let selectedWardIds = wards.map(function (obj) {
      return obj.id;
    });

    let selectedLsgIds = selectedLsds.map(function (obj) {
      return obj.id;
    });

    const data = {
      wards: selectedWardIds.length ? selectedWardIds : undefined,
      local_bodies: selectedLsgIds.length ? selectedLsgIds : undefined
    };
    onChange(data);
  };

  const sortByName = (items: any) => {
    items.sort(function (a: any, b: any) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
  };

  useEffect(() => {
    async function getWardList() {
      const id: number = currentUser.data.district;
      const res = await dispatch(getAllLocalBody({ id }));
      let allWards: any[] = [];
      let allLsgs: any[] = [];
      res?.data?.forEach((local: any) => {
        allLsgs = [
          ...allLsgs,
          { id: local.id, name: local.name },
        ];
        if (local.wards) {
          local.wards.forEach((ward: any) => {
            allWards = [
              ...allWards,
              { id: ward.id, name: ward.name, panchayath: local.name },
            ];
          });
        }
      });
      sortByName(allWards);
      sortByName(allLsgs);
      setWardList(allWards || []);
      setLsgList(allLsgs || []);
      const filteredWard = filter?.wards?.split(",").map(Number);
      let selectedWards: any =
        filteredWard && allWards
          ? allWards.filter(({ id }: { id: number }) => {
            return filteredWard.includes(id);
          })
          : [];
      setWards(selectedWards);

      const filteredLsgs = filter?.local_bodies?.split(",").map(Number);
      let selectedLsgs: any =
        filteredLsgs && allLsgs
          ? allLsgs.filter(({ id }: { id: number }) => {
            return filteredLsgs.includes(id);
          })
          : [];
      setSelectedLsgs(selectedLsgs);
      setLoading(false);
    }
    getWardList();
  }, []);

  return (
    <div>
      <div className="flex justify-between">
        <button className="btn btn-default" onClick={closeFilter}>
          <i className="fas fa-times mr-2" />
          Cancel
        </button>
        <Link
          href="/external_results"
          className="btn btn-default hover:text-gray-900"
        >
          <i className="fas fa-times mr-2" />
          Clear Filters
        </Link>
        <button className="btn btn-primary" onClick={applyFilter}>
          <i className="fas fa-check mr-2" />
          Apply
        </button>
      </div>
      <div className="font-light text-md mt-2">Filter By:</div>
      <div className="flex flex-wrap gap-2">
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Lsg</span>
          <AutoCompleteAsyncField
            multiple={true}
            name="local_bodies"
            options={lsgList}
            label="Local Body"
            variant="outlined"
            placeholder="Select Local Body"
            loading={loading}
            freeSolo={false}
            value={selectedLsds}
            renderOption={(option: any) => <div>{option.name}</div>}
            getOptionSelected={(option: any, value: any) =>
              option.id === value.id
            }
            getOptionLabel={(option: any) => option.name}
            onChange={(e: object, value: any) => handleLsgChange(value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Ward</span>
          <AutoCompleteAsyncField
            multiple={true}
            name="wards"
            options={wardList}
            label="Ward"
            variant="outlined"
            placeholder="Select wards"
            loading={loading}
            freeSolo={false}
            value={wards}
            renderOption={(option: any) => <div>{option.name}</div>}
            getOptionSelected={(option: any, value: any) =>
              option.id === value.id
            }
            getOptionLabel={(option: any) => option.name}
            onChange={(e: object, value: any) => handleWardChange(value)}
          />
        </div>
      </div>
    </div>
  );
}
