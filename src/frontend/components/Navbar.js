import {
    Link
} from "react-router-dom";
import { Navbar, Nav, Button, Container } from 'react-bootstrap'
import market from './market.png'

const Navigation = ({ web3Handler, account }) => {
    return (
        <Navbar expand="lg" bg="secondary" variant="light">
            <Container>
                <Navbar.Brand>
                    {/* <img src={market} width="40" height="40" className="" alt="" /> */}
                    &nbsp; Anime NFT Marketplace
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                {account ? (<Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/mint">Mint</Nav.Link>
                        <Nav.Link as={Link} to="/my-listed-items">My Listed Items</Nav.Link>
                        <Nav.Link as={Link} to="/my-purchases">My Purchases</Nav.Link>
                    </Nav>
                    <Nav>

                        <Nav.Link
                            href={`https://etherscan.io/address/${account}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button nav-button btn-sm mx-4">
                            <Button variant="outline-light">
                                {account.slice(0, 5) + '...' + account.slice(38, 42)}
                            </Button>

                        </Nav.Link>

                    </Nav>
                </Navbar.Collapse>) : (
                    <Button onClick={web3Handler} variant="outline-light">Connect Wallet</Button>
                )}
            </Container>
        </Navbar>
    )

}

export default Navigation;