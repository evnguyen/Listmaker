import { useEffect, useState } from 'react';
import {
    useQuery,
    useMutation,
    gql,
} from "@apollo/client";
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

const Home = () => {
    const [restaurants, setRestaurants] = useState();
    const [list, setList] = useState([]);
    const [showAdded, setShowAdded] = useState(false);
    const listData = useQuery(gql`
        query getFeed {
          list {
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
    const [addRestaurant, addRestaurantStatus] = useMutation(gql`
        mutation addRestaurant($restaurant: RestaurantInput!) {
          addRestaurant(restaurant: $restaurant) {
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
    const [deleteRestaurant, deleteRestaurantStatus] = useMutation(gql`
        mutation deleteRestaurant($id: ID!) {
          deleteRestaurant(id: $id) 
        }
      `, { onCompleted: handleDeleteCallback, onError: handleDeleteCallbackErr}
    );


    useEffect( () => {
        const getData = async () => {
            navigator.geolocation.getCurrentPosition(async (geo) => {
                const res = await fetch(`/api/restaurants?latitude=${geo.coords.latitude}&longitude=${geo.coords.longitude}`);
                const data = await res.json();
                setRestaurants(data.businesses ?? []);
                console.log('Got restuarants: ', data.businesses);
            }, () => {});
        };
        getData();
    }, []);

    useEffect(() => {
        if (listData.loading === false) {
            console.log('Got list:: ', listData.data.list);
            const savedList = [];
            listData.data?.list?.map(item => {
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
    }, [listData]);


    const handleAdd = (restaurant) => {
        console.log(`ADDING ${restaurant.name}`);

        addRestaurant({
            variables: { restaurant: {data: JSON.stringify(restaurant)} },
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

    return (
        <div className="App">
            <ToggleButtonGroup
                color="primary"
                value={showAdded}
                exclusive
                onChange={(e, value) => {setShowAdded(value)}}
            >
                <ToggleButton value={false}>All</ToggleButton>
                <ToggleButton value={true}>My list</ToggleButton>
            </ToggleButtonGroup>
            <ImageList sx={{ width: '100%', height: '100%' }}>
                <ImageListItem key="Subheader" cols={2}>
                    <ListSubheader component="div">Top Restaurants</ListSubheader>
                </ImageListItem>
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
