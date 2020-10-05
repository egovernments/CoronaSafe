/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useCallback, useState } from "react";
import loadable from '@loadable/component';
import { useDispatch, useSelector } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { addUserFacility, deleteUserFacility, getUserList, getUserListFacility, searchUser } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { navigate } from "raviger";
import { USER_TYPES } from "../../Common/constants";
import { InputSearchBox } from "../Common/SearchBox";
import { FacilityModel } from '../Facility/models';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { IconButton } from '@material-ui/core';
import LinkFacilityDialog from './LinkFacilityDialog';
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ManageUsers(props: any) {
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageUsers: any = null;
  const [users, setUsers] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFacilityLoading, setIsFacilityLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);

  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const isSuperuser = currentUser.data.is_superuser;
  const userType = currentUser.data.user_type;
  const userIndex = USER_TYPES.indexOf(userType);
  const userTypes = isSuperuser ? [...USER_TYPES] : USER_TYPES.slice(0, userIndex + 1);
  const [linkFacility, setLinkFacility] = useState<{ show: boolean; username: string }>({ show: false, username: '' });

  const limit = userTypes.length ? 13 : 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getUserList({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setUsers(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatch, limit, offset]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const searchByName = async (searchValue: string) => {
    setIsLoading(true);
    const res = await dispatch(searchUser({ limit, offset, name: searchValue }));
    if (res && res.data) {
      setUsers(res.data.results);
      setTotalCount(res.data.count);
    }
    setIsLoading(false);
  }

  const searchByPhone = async (searchValue: string) => {
    setIsLoading(true);
    const res = await dispatch(searchUser({ limit, offset, phone_number: encodeURI(searchValue) }));
    if (res && res.data) {
      setUsers(res.data.results);
      setTotalCount(res.data.count);
    }
    setIsLoading(false);
  }
  const addUser = (<button className="px-4 py-1 rounded-md bg-green-500 mt-4 text-white text-lg font-semibold rounded shadow"
    onClick={() => navigate("/user/add")}>
    <i className="fas fa-plus mr-2"></i>
    Add New User
  </button >);

  const loadFacilities = async (username: string) => {
    if (isFacilityLoading) {
      return;
    }
    setIsFacilityLoading(true);
    const res = await dispatch(getUserListFacility(username));
    if (res && res.data) {
      console.log(res.data);
      const updated = users.map(user => {
        return user.username === username ? {
          ...user,
          facilities: res.data,
        } : user;
      });
      setUsers(updated);
    }
    setIsFacilityLoading(false);
  };

  const removeFacility = async (username: string, facility: any) => {
    console.log(username, facility);
    setIsFacilityLoading(true);
    await dispatch(deleteUserFacility(username, String(facility.id)));
    setIsFacilityLoading(false);
    loadFacilities(username);
  }

  const showFacilities = (username: string, facilities: FacilityModel[]) => {
    if (!facilities || !facilities.length) {
      return <div className="font-semibold">No Facilites!</div>
    }
    return (<>
      {(facilities.map(facility => (<div className="flex items-center mb-2">
        <div className="font-semibold">{facility.name}</div>
        <IconButton size="small" disabled={isFacilityLoading} onClick={() => removeFacility(username, facility)}>
          <DeleteForeverIcon />
        </IconButton>
      </div>)
      ))}
      <a onClick={() => showLinkFacility(username)} className={`align-baseline font-bold text-sm ${!isFacilityLoading ? "text-blue-500 hover:text-blue-800" : "text-gray-500"}`} href="#" >Link new facility</a>
    </>);
  };

  const addFacility = async (username: string, facility: any) => {
    console.log(username, facility);
    hideLinkFacility();
    setIsFacilityLoading(true);
    await dispatch(addUserFacility(username, String(facility.id)));
    setIsFacilityLoading(false);
    loadFacilities(username);
  };

  const showLinkFacility = (username: string) => {
    setLinkFacility({
      show: true,
      username,
    });
  };

  const hideLinkFacility = () => {
    setLinkFacility({
      show: false,
      username: ''
    });
  };

  let userList: any[] = [];
  if (users && users.length) {
    userList = users.map((user: any, idx: number) => {
      return (
        <div key={`usr_${user.id}`} className="w-full md:w-1/2 mt-6 md:px-4">
          <div
            className="block rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 overflow-hidden"
          >
            <div className="h-full flex flex-col justify-between">
              <div className="px-6 py-4">
                {user.username && (
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-blue-100 text-blue-800">
                    {user.username}
                  </div>)}
                <div className="font-black text-2xl capitalize mt-2">
                  {`${user.first_name} ${user.last_name}`}
                </div>

                {user.user_type && (
                  <div className="mt-2">
                    <div className="text-gray-500 leading-relaxed font-light">Role:</div>
                    <div className="font-semibold">{user.user_type}</div>
                  </div>)}
                {user.local_body_object && (
                  <div className="mt-2">
                    <div className="text-gray-500 leading-relaxed font-light">Location:</div>
                    <div className="font-semibold">{user.local_body_object.name}</div>
                  </div>)}
                {user.district_object && (
                  <div className="mt-2">
                    <div className="text-gray-500 leading-relaxed font-light">District:</div>
                    <div className="font-semibold">{user.district_object.name}</div>
                  </div>)}
                <div className="mt-2">
                  <div className="text-gray-500 leading-relaxed font-light">Facilities:</div>
                  {user.facilities && (showFacilities(user.username, user.facilities))}
                  {!user.facilities && (
                    <a onClick={() => loadFacilities(user.username)} className={`inline-block align-baseline font-bold text-sm ${!isFacilityLoading ? "text-blue-500 hover:text-blue-800" : "text-gray-500"}`} href="#">
                      Click here to show
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-2 bg-gray-50 border-t px-6 py-2">
                <div className="flex py-4 justify-between">
                  <div>
                    <div className="text-gray-500 leading-relaxed">Phone:</div>
                    <a href={`tel:${user.phone_number}`} className="font-semibold">{user.phone_number || "-"}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !users) {
    manageUsers = <Loading />;
  } else if (users && users.length) {
    manageUsers = (<div>
      {userTypes.length && addUser}
      <div className="flex flex-wrap md:-mx-4">
        {userList}
      </div>
      {totalCount > limit && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination
            cPage={currentPage}
            defaultPerPage={limit}
            data={{ totalCount }}
            onChange={handlePagination}
          />
        </div>
      )}
    </div>);
  } else if (users && users.length === 0) {
    manageUsers = (<div>
      {userTypes.length && addUser}
      <div>
        <h5> No Users Found</h5>
      </div>
    </div>);
  }

  return (
    <div>
      {linkFacility.show && (<LinkFacilityDialog
        username={linkFacility.username}
        handleOk={addFacility}
        handleCancel={hideLinkFacility}
      />)}
      <PageTitle
        title="User Management"
        hideBack={true}
        className="mx-3 md:mx-8" />
      {/*<div className="flex flex-col md:flex-row px-4 md:px-8">*/}
      {/*<div className="md:px-4">*/}
      {/*  <div className="text-sm font-semibold mb-2">*/}
      {/*    Search by Name*/}
      {/*  </div>*/}
      {/*  <InputSearchBox*/}
      {/*      search={searchByName}*/}
      {/*      placeholder='Search by Name'*/}
      {/*      errors=''*/}
      {/*  />*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*  <div className="text-sm font-semibold mb-2">*/}
      {/*    Search by number*/}
      {/*  </div>*/}
      {/*  <InputSearchBox*/}
      {/*      search={searchByPhone}*/}
      {/*      placeholder='+919876543210'*/}
      {/*      errors=''*/}
      {/*  />*/}
      {/*</div>*/}
      {/*</div>*/}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 m-4 md:px-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Users
              </dt>
              <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                {totalCount}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="px-3 md:px-8">
        <div>
          {manageUsers}
        </div>
      </div>
    </div>
  );
}
