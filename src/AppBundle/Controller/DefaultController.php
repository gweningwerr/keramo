<?php

namespace AppBundle\Controller;

use AppBundle\Entity\Testing;
use AppBundle\Helper\App;
use AppBundle\Helper\RequestHelper;
use AppBundle\Repository\BannerRepository;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;


class DefaultController extends Controller
{
	/**
	 *
	 * @return \Symfony\Component\HttpFoundation\Response
	 */
    public function indexAction()
    {

	    /**
	     * @var BannerRepository
	     */
    	$Testing = App::getRepository('AppBundle:Testing');
	    App::dumpExit($Testing->findAll());
	    App::dump( App::getCurLocale());
        // replace this example code with whatever you need
        return $this->render('default/index.html.twig', [
            'base_dir' => realpath($this->getParameter('kernel.root_dir').'/..'),
        ]);
    }
}
