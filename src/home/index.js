import { useEffect, useState } from 'react';
import {
    useLazyQuery,
    useMutation,
    gql,
} from "@apollo/client";
import { useHistory } from "react-router-dom";
import './styles.css';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import ListSubheader from '@mui/material/ListSubheader';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Button from '@mui/material/Button';
import { useAuth0 } from "@auth0/auth0-react";

const Home = () => {
    const { isAuthenticated, isLoading, logout, user } = useAuth0();
    const history = useHistory();
    const [restaurants, setRestaurants] = useState();
    const [userID, setUserID] = useState();
    const [list, setList] = useState([]);
    const [showAdded, setShowAdded] = useState(false);
    const [getList, listData] = useLazyQuery(gql`
        query getList($user: ID!) {
          list(user: $user) {
            id,
            data
          }
        }
      `
    );



    const handleAddCallback = (data) => {
        console.log(data);
        setList([...list, { id: data?.addRestaurant?.lastID, data: JSON.parse(data?.addRestaurant?.data) }]);
    };
    const handleAddCallbackErr = (error) => {
        console.error('Got error on add restaurant: ', error);
    };
    const [addRestaurant] = useMutation(gql`
        mutation addRestaurant($restaurant: RestaurantInput!, $user: ID!) {
          addRestaurant(restaurant: $restaurant, user: $user) {
            lastID,
            changes,
            data
          }
        }
      `, { onCompleted: handleAddCallback, onError: handleAddCallbackErr}
    );



    const handleDeleteCallback = (data) => {
        setList(list.filter(el => el.id !== data.deleteRestaurant));
    };
    const handleDeleteCallbackErr = (error) => {
        console.error('Got error on delete restaurant: ', error);
    };
    const [deleteRestaurant] = useMutation(gql`
        mutation deleteRestaurant($id: ID!) {
          deleteRestaurant(id: $id) 
        }
      `, { onCompleted: handleDeleteCallback, onError: handleDeleteCallbackErr}
    );



    const handleAddUserCallback = (data) => {
        setUserID(data.addUser);
        getList({
            variables: { user: data.addUser },
        });
    };
    const handleAddUserCallbackErr = (error) => {
        console.error('Got error on adding user: ', error);
    };
    const [addUser] = useMutation(gql`
        mutation addUser($user: User!) {
          addUser(user: $user)
        }
      `, { onCompleted:handleAddUserCallback, onError: handleAddUserCallbackErr}
    );


    useEffect( () => {
        const getRestaurantData = async () => {
            navigator.geolocation.getCurrentPosition(async (geo) => {
                const res = await fetch(`/api/restaurants?latitude=${geo.coords.latitude}&longitude=${geo.coords.longitude}`);
                const data = await res.json();
                setRestaurants(data.businesses ?? []);
                console.log('Got restuarants: ', data.businesses);
            }, () => {});
        };
        if (isAuthenticated) {
            getRestaurantData();
        }

        // addUser will add user to db if not already. On complete, get list from user
        if (user) {
            addUser({
                variables: { user: {name: user.name, email: user.email} },
            });
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // TODO: Use callback instead of useEffect
        if (listData.loading === false && isAuthenticated) {
            console.log('Got list:: ', listData?.data?.list);
            const savedList = [];
            listData.data?.list?.forEach(item => {
                savedList.push({
                    id: item.id,
                    data: JSON.parse(item.data),
                })
            });
            setList(savedList);
        }
        if (listData.error) {
            console.error('Error on feed ', listData.error);
        }
    }, [listData, isAuthenticated]);


    const handleAdd = (restaurant) => {
        console.log(`ADDING ${restaurant.name}`);

        addRestaurant({
            variables: { restaurant: {data: JSON.stringify(restaurant)}, user: userID },
        });
    };

    const handleDelete = (restaurant) => {
        console.log('DELETING ', restaurant);
        deleteRestaurant({
            variables: { id: restaurant.id },
        });
    };

    const findRestaurant = (id) => {
        return list.find(el => el.data.id === id);
    };
    
    const handleShowAddedToggle = (e, value) => {
        if (value != null) {
            setShowAdded(value)
        }
    };

    if (!isAuthenticated && !isLoading) {
        console.log('Not logged in');
        history.push('/login');
    }
    else if (isLoading) {
        return <CircularProgress />
    }

    return (
        <div className="App">
            <div className="header">
                <ToggleButtonGroup
                    color="primary"
                    value={showAdded}
                    exclusive
                    onChange={handleShowAddedToggle}
                    className="toggleButtonGroup"
                >
                    <ToggleButton value={false}>All</ToggleButton>
                    <ToggleButton value={true}>My list</ToggleButton>
                </ToggleButtonGroup>
                <Button
                    variant="text"
                    onClick={() => logout({ returnTo: window.location.origin })}
                    size="small"
                >
                    Logout
                </Button>
            </div>
            <h1>Top Restaurants in Your Area</h1>
            <ImageList sx={{ width: '100%', height: '100%' }}>
                {restaurants && !showAdded &&
                    restaurants.map((item) => (
                        <ImageListItem key={item.id}>
                            <img
                                src={`${item.image_url}?w=248&fit=crop&auto=format`}
                                loading="lazy"
                                onClick={() => {
                                    window.open(item.url, '_blank').focus();
                                }}
                                className="restaurantItem"
                                alt={item.name}
                            />
                            <ImageListItemBar
                                title={item.name}
                                actionIcon={
                                    <IconButton
                                        sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                        aria-label={`info about ${item.title}`}
                                        onClick={findRestaurant(item.id) ? () => {handleDelete(findRestaurant(item.id))} : () => {handleAdd(item)}}
                                    >
                                        {findRestaurant(item.id) ? <DeleteIcon /> : <AddIcon />}
                                    </IconButton>
                                }
                            />
                        </ImageListItem>
                    ))
                }
                {showAdded &&
                    list.map((item) => {
                        console.log(list);
                        const itemData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
                        return (
                            <ImageListItem key={`${itemData.id}-mylist`}>
                                <img
                                    src={`${itemData.image_url}?w=248&fit=crop&auto=format`}
                                    loading="lazy"
                                    onClick={() => {
                                        window.open(itemData.url, '_blank').focus();
                                    }}
                                    className="restaurantItem"
                                    alt={item.name}
                                />
                                <ImageListItemBar
                                    title={itemData.name}
                                    actionIcon={
                                        <IconButton
                                            sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                            aria-label={`info about ${itemData.title}`}
                                            onClick={findRestaurant(itemData.id) ? () => {handleDelete(findRestaurant(itemData.id))} : () => {handleAdd(itemData)}}
                                        >
                                            {findRestaurant(itemData.id) ? <DeleteIcon /> : <AddIcon />}
                                        </IconButton>
                                    }
                                />
                            </ImageListItem>
                        )
                    })
                }
            </ImageList>
            {!restaurants && !showAdded && (<CircularProgress style={{margin: 'auto'}} />)}
        </div>
    );
};

export default Home;
